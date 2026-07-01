import satori from 'satori';
import { parse as parseTwemoji } from 'twemoji-parser';

import type {
    PolymarketShareIdentity,
    PolymarketShareImageParams,
    PolymarketSharePositionParams,
    PolymarketShareSportInfo,
    PolymarketShareSportTeam,
} from '@/helpers/polymarketShareImage.js';
import { removeVS16s } from '@/helpers/removeVS16s.js';
import { svgToPngBlob } from '@/helpers/svgToPngBlob.js';
import { untilImageUrlLoaded } from '@/helpers/untilImageLoaded.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import { fetchImageAsDataUri } from '@/services/polymarketShareImage/assets.js';
import {
    buildPositionTree,
    buildWinningsTree,
    MAX_WINNING_ROWS,
    SHARE_IMAGE_HEIGHT,
    SHARE_IMAGE_WIDTH,
    type ShareImageAssets,
} from '@/services/polymarketShareImage/render.js';

// Hiragana/Katakana/CJK/Hangul — load the heavy NotoSansSC face only when the text needs it.
const CJK_PATTERN = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

function collectRenderedText(params: PolymarketShareImageParams): string {
    if (params.type === 'winnings') {
        return [...params.items.map((item) => item.title), params.identity.displayName].join(' ');
    }
    const parts = [params.title, params.outcome, params.identity.displayName];
    if (params.sport) {
        parts.push(params.sport.home.name, params.sport.away.name);
        if (params.sport.predicted.kind === 'team') parts.push(params.sport.predicted.team.name);
    }
    return parts.join(' ');
}

function fontPreferencesFor(params: PolymarketShareImageParams): string[] {
    return CJK_PATTERN.test(collectRenderedText(params)) ? ['Inter', 'NotoSansSC'] : ['Inter'];
}

// The remote images a position card needs: the user avatar, plus the event icon or the sports logos.
function imageSourcesFor(params: PolymarketSharePositionParams): {
    avatarUrl?: string;
    marketIcon?: string;
    homeLogo?: string;
    awayLogo?: string;
    predictedLogo?: string;
} {
    const avatarUrl = params.identity.avatarUrl;
    if (params.sport) {
        return {
            avatarUrl,
            homeLogo: params.sport.home.logo,
            awayLogo: params.sport.away.logo,
            predictedLogo: params.sport.predicted.kind === 'team' ? params.sport.predicted.team.logo : undefined,
        };
    }
    return { avatarUrl, marketIcon: params.imageUrl };
}

function fetchOptional(url: string | undefined): Promise<string | null> {
    return url ? fetchImageAsDataUri(url) : Promise.resolve(null);
}

const EMPTY_ASSETS: ShareImageAssets = {
    avatar: null,
    marketIcon: null,
    homeLogo: null,
    awayLogo: null,
    predictedLogo: null,
};

function sanitizeTeam(team: PolymarketShareSportTeam): PolymarketShareSportTeam {
    return { ...team, name: removeVS16s(team.name) };
}

function sanitizeSport(sport: PolymarketShareSportInfo | undefined): PolymarketShareSportInfo | undefined {
    if (!sport) return sport;
    return {
        ...sport,
        home: sanitizeTeam(sport.home),
        away: sanitizeTeam(sport.away),
        predicted:
            sport.predicted.kind === 'team'
                ? { kind: 'team', team: sanitizeTeam(sport.predicted.team) }
                : sport.predicted,
    };
}

function sanitizeIdentity(identity: PolymarketShareIdentity): PolymarketShareIdentity {
    return { ...identity, displayName: removeVS16s(identity.displayName) };
}

// twemoji-parser emits legacy (now-defunct) asset URLs; we only reuse the `<codepoints>.svg` filename
// and rebuild it against a live jsdelivr mirror. Use the 72x72 PNG (not the SVG): the raster asset has
// an intrinsic size, so the proxy's `<img>` → `<canvas>` conversion produces a correctly-sized bitmap.
const TWEMOJI_PNG_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/';

// satori renders a grapheme image at the full 1em box, so a raw emoji looks larger than the cap-height
// text beside it. Re-composite each emoji onto a transparent square with margin so the visible glyph is
// ~EMOJI_GLYPH_RATIO of the box (near the text height), nudged slightly down toward the baseline.
const EMOJI_BOX = 128;
const EMOJI_GLYPH_RATIO = 0.8;
const EMOJI_BASELINE_NUDGE = 0.05;

async function fitEmojiToText(dataUri: string): Promise<string> {
    const image = await untilImageUrlLoaded(dataUri);
    const canvas = document.createElement('canvas');
    canvas.width = EMOJI_BOX;
    canvas.height = EMOJI_BOX;
    const context = canvas.getContext('2d');
    if (!context) return dataUri;
    const glyph = Math.round(EMOJI_BOX * EMOJI_GLYPH_RATIO);
    const offset = (EMOJI_BOX - glyph) / 2;
    context.drawImage(image, offset, offset + EMOJI_BOX * EMOJI_BASELINE_NUDGE, glyph, glyph);
    const result = canvas.toDataURL('image/png');
    // Release the backing store immediately instead of waiting for GC (the emoji <img> is dropped by
    // untilImageUrlLoaded, which nulls its handlers on settle).
    canvas.width = 0;
    canvas.height = 0;
    return result;
}

/**
 * Builds satori's `graphemeImages` map (emoji grapheme → image data URI) for every emoji in `content`.
 *
 * Unlike the server-side red-packet renderer (which rasterizes via resvg), this card is rasterized on
 * the client by {@link svgToPngBlob} (`<img>` → `<canvas>`), which does NOT reliably draw a nested
 * SVG-in-SVG `<image>`. So each Twemoji emoji is loaded as a PNG through the same-origin image proxy via
 * {@link fetchImageAsDataUri} (the same path the avatars/logos use), yielding a PNG data URI the canvas
 * rasterizes reliably. Best-effort: a failed emoji is dropped (falls back to the font → tofu box).
 */
async function loadEmojiGraphemeImages(content: string): Promise<Record<string, string>> {
    const emojis = parseTwemoji(content).filter((token) => token.type === 'emoji' && token.url);
    const entries = await Promise.all(
        emojis.map(async (emoji): Promise<[string, string] | null> => {
            const codepoints = emoji.url
                .split('/')
                .pop()
                ?.replace(/\.svg$/i, '');
            if (!codepoints) return null;
            const dataUri = await fetchImageAsDataUri(`${TWEMOJI_PNG_BASE}${codepoints}.png`).catch(() => null);
            if (!dataUri) return null;
            const fitted = await fitEmojiToText(dataUri).catch(() => dataUri);
            return [emoji.text, fitted];
        }),
    );
    return Object.fromEntries(entries.filter((entry): entry is [string, string] => entry !== null));
}

/**
 * Strips VS16 variation selectors from every rendered text field. satori can't segment VS16, which
 * breaks the {@link loadTwemojiUrls} grapheme lookup for emoji like ❤️; removing it on both the rendered
 * text and the Twemoji source keeps them in sync. Image/avatar URLs are left untouched.
 */
function sanitizeShareParams(params: PolymarketShareImageParams): PolymarketShareImageParams {
    if (params.type === 'winnings') {
        return {
            ...params,
            identity: sanitizeIdentity(params.identity),
            items: params.items.map((item) => ({ ...item, title: removeVS16s(item.title) })),
        };
    }
    return {
        ...params,
        title: removeVS16s(params.title),
        outcome: removeVS16s(params.outcome),
        identity: sanitizeIdentity(params.identity),
        sport: sanitizeSport(params.sport),
    };
}

/**
 * Prefetches the heavy bits (this lazily-imported chunk's satori/yoga wasm + the font buffers) so the
 * first "Share image" click doesn't pay the download. Best-effort; safe to call repeatedly (fonts are
 * memoized in getSatoriFonts). Call when the share menu opens.
 */
export async function warmupPolymarketShareImage(params: PolymarketShareImageParams): Promise<void> {
    try {
        await Promise.all([
            getSatoriFonts(fontPreferencesFor(params)),
            // avatar fetch is the slow part (~2s on dev stamp) — warm + cache it now so the click is fast
            fetchOptional(params.identity.avatarUrl),
        ]);
    } catch {
        // best-effort prewarm — the real render will surface any error
    }
}

/**
 * FW-7696 / FW-7810 — renders the Polymarket share card to a PNG Blob entirely on the client: satori
 * overlays the dynamic content on the pre-rendered decorative frame and the browser rasterizes it (so
 * webp avatars/logos decode natively).
 */
export async function createPolymarketShareImage(params: PolymarketShareImageParams): Promise<Blob> {
    // satori renders glyphs from the loaded TTFs only (no color-emoji fonts), so map every emoji
    // grapheme to a Twemoji image and strip VS16 selectors it can't segment — otherwise names/titles
    // with emoji render as tofu boxes.
    const safeParams = sanitizeShareParams(params);
    const fontsPromise = getSatoriFonts(fontPreferencesFor(safeParams));
    const graphemeImagesPromise = loadEmojiGraphemeImages(collectRenderedText(safeParams));

    let tree;
    if (safeParams.type === 'winnings') {
        const [avatar, icons] = await Promise.all([
            fetchOptional(safeParams.identity.avatarUrl),
            Promise.all(safeParams.items.slice(0, MAX_WINNING_ROWS).map((item) => fetchOptional(item.image))),
        ]);
        tree = buildWinningsTree(safeParams, { ...EMPTY_ASSETS, avatar }, icons);
    } else {
        const sources = imageSourcesFor(safeParams);
        const [avatar, marketIcon, homeLogo, awayLogo, predictedLogo] = await Promise.all([
            fetchOptional(sources.avatarUrl),
            fetchOptional(sources.marketIcon),
            fetchOptional(sources.homeLogo),
            fetchOptional(sources.awayLogo),
            fetchOptional(sources.predictedLogo),
        ]);
        tree = buildPositionTree(safeParams, { avatar, marketIcon, homeLogo, awayLogo, predictedLogo });
    }

    const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        fonts: await fontsPromise,
        graphemeImages: await graphemeImagesPromise,
    });

    return svgToPngBlob(svg, SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT);
}
