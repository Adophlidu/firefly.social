import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import QRCode from 'react-qr-code';

import { fetchImageAsPNG } from '@/helpers/fetchImageAsPNG.js';
import { QR_LOGO_HEIGHT, QR_LOGO_INNER_SVG, QR_LOGO_WIDTH } from '@/services/polymarketShareImage/logo.js';

function blobToDataUri(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob'));
        reader.readAsDataURL(blob);
    });
}

async function loadImageAsDataUri(url: string): Promise<string | null> {
    try {
        return await blobToDataUri(await fetchImageAsPNG(url, true));
    } catch {
        return null;
    }
}

// Memoize by URL: avatar hosts (stamp.*) can be slow (~2s), and the same avatar is fetched on menu
// prewarm and again on the actual render — the cache turns the second call into an instant hit.
const dataUriCache = new Map<string, Promise<string | null>>();

/**
 * Loads a remote image into a PNG data URI via `<img crossorigin> → canvas`, NOT `fetch`. The app's
 * CSP `connect-src` is a strict allowlist, so a browser `fetch` of an avatar host (e.g.
 * stamp.firefly.land) is blocked; `img-src` is `*`, so loading through an `<img>` element works for
 * any CORS-enabled source and decodes webp/avif natively. Returns null when the image is unavailable
 * or its server omits CORS headers (the canvas would taint) — the caller renders the fallback initial.
 */
export function fetchImageAsDataUri(url: string): Promise<string | null> {
    const cached = dataUriCache.get(url);
    if (cached) return cached;

    const promise = loadImageAsDataUri(url);
    dataUriCache.set(url, promise);
    // don't cache failures permanently — a later attempt should be able to retry
    void promise.then((result) => {
        if (result === null) dataUriCache.delete(url);
    });
    return promise;
}

/** Injects a white rounded knockout + the centred Firefly mascot before the QR's closing tag. */
function withCenterLogo(qrSvg: string): string {
    const size = Number(qrSvg.match(/viewBox="0 0 (\d+(?:\.\d+)?) /)?.[1]);
    if (!Number.isFinite(size)) return qrSvg;

    const box = size * 0.26;
    const knockout = `<rect x="${(size - box) / 2}" y="${(size - box) / 2}" width="${box}" height="${box}" rx="${size * 0.06}" fill="#ffffff"/>`;

    const logoHeight = size * 0.18;
    const scale = logoHeight / QR_LOGO_HEIGHT;
    const logoWidth = QR_LOGO_WIDTH * scale;
    const logo = `<g transform="translate(${(size - logoWidth) / 2} ${(size - logoHeight) / 2}) scale(${scale})">${QR_LOGO_INNER_SVG}</g>`;

    return qrSvg.replace('</svg>', `${knockout}${logo}</svg>`);
}

/**
 * Renders the QR as an SVG data URI with the Firefly mascot knocked out of its centre (error
 * correction 'H' so the centre logo can't break scanning). Reuses react-qr-code (already a dep).
 */
export function createQrCodeDataUri(url: string): string {
    const svg = renderToStaticMarkup(
        createElement(QRCode, { value: url, level: 'H', size: 150, bgColor: '#ffffff', fgColor: '#000000' }),
    );
    return `data:image/svg+xml;utf8,${encodeURIComponent(withCenterLogo(svg))}`;
}
