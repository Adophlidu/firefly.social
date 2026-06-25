import satori from 'satori';

import type { PolymarketShareImageParams } from '@/helpers/polymarketShareImage.js';
import { svgToPngBlob } from '@/helpers/svgToPngBlob.js';
import { getSatoriFonts } from '@/services/getSatoriFonts.js';
import { createQrCodeDataUri, fetchImageAsDataUri } from '@/services/polymarketShareImage/assets.js';
import { SHARE_IMAGE_LOGO } from '@/services/polymarketShareImage/logo.js';
import {
    applyFrostedGlass,
    buildPositionTree,
    buildSingleWinningTree,
    buildWinningsTree,
    MAX_WINNING_ROWS,
    SHARE_IMAGE_HEIGHT,
    SHARE_IMAGE_WIDTH,
    type ShareImageAssets,
} from '@/services/polymarketShareImage/render.js';

// Hiragana/Katakana/CJK/Hangul — load the heavy NotoSansSC face only when the text needs it.
const CJK_PATTERN = /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

function collectRenderedText(params: PolymarketShareImageParams): string {
    if (params.type === 'position') return `${params.title} ${params.outcome} ${params.identity.displayName}`;
    return `${params.items.map((item) => item.title).join(' ')} ${params.identity.displayName}`;
}

function fontPreferencesFor(params: PolymarketShareImageParams): string[] {
    return CJK_PATTERN.test(collectRenderedText(params)) ? ['Inter', 'NotoSansSC'] : ['Inter'];
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
            params.identity.avatarUrl ? fetchImageAsDataUri(params.identity.avatarUrl) : Promise.resolve(null),
        ]);
    } catch {
        // best-effort prewarm — the real render will surface any error
    }
}

/**
 * FW-7696 — renders the Polymarket share card to a PNG Blob entirely on the client: satori builds the
 * SVG, `applyFrostedGlass` adds the iOS glass panels, and the browser rasterizes it (so webp avatars
 * decode natively). Mirrors the firefly-workers `/polymarket/share-image` output without a round-trip.
 */
export async function createPolymarketShareImage(params: PolymarketShareImageParams): Promise<Blob> {
    const [fonts, avatar] = await Promise.all([
        getSatoriFonts(fontPreferencesFor(params)),
        params.identity.avatarUrl ? fetchImageAsDataUri(params.identity.avatarUrl) : Promise.resolve(null),
    ]);

    const assets: ShareImageAssets = { logo: SHARE_IMAGE_LOGO, avatar, qr: createQrCodeDataUri(params.qrUrl) };

    let tree;
    if (params.type === 'position') {
        tree = buildPositionTree(params, assets);
    } else if (params.items.length === 1) {
        tree = buildSingleWinningTree(params, assets);
    } else {
        const icons = await Promise.all(
            params.items
                .slice(0, MAX_WINNING_ROWS)
                .map((item) => (item.image ? fetchImageAsDataUri(item.image) : Promise.resolve(null))),
        );
        tree = buildWinningsTree(params, assets, icons);
    }

    const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
        width: SHARE_IMAGE_WIDTH,
        height: SHARE_IMAGE_HEIGHT,
        fonts,
    });

    return svgToPngBlob(applyFrostedGlass(svg), SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT);
}
