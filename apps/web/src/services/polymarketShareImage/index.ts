import satori from 'satori';

import type { PolymarketShareImageParams, PolymarketSharePositionParams } from '@/helpers/polymarketShareImage.js';
import { svgToPngBlob } from '@/helpers/svgToPngBlob.js';
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
    const fontsPromise = getSatoriFonts(fontPreferencesFor(params));

    let tree;
    if (params.type === 'winnings') {
        const [avatar, icons] = await Promise.all([
            fetchOptional(params.identity.avatarUrl),
            Promise.all(params.items.slice(0, MAX_WINNING_ROWS).map((item) => fetchOptional(item.image))),
        ]);
        tree = buildWinningsTree(params, { ...EMPTY_ASSETS, avatar }, icons);
    } else {
        const sources = imageSourcesFor(params);
        const [avatar, marketIcon, homeLogo, awayLogo, predictedLogo] = await Promise.all([
            fetchOptional(sources.avatarUrl),
            fetchOptional(sources.marketIcon),
            fetchOptional(sources.homeLogo),
            fetchOptional(sources.awayLogo),
            fetchOptional(sources.predictedLogo),
        ]);
        tree = buildPositionTree(params, { avatar, marketIcon, homeLogo, awayLogo, predictedLogo });
    }

    const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        fonts: await fontsPromise,
    });

    return svgToPngBlob(svg, SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT);
}
