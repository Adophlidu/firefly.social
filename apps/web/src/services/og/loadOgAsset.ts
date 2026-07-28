import { getSatoriFonts } from '@/services/getSatoriFonts.js';

export interface OgAssets {
    fetch(input: Request): Promise<Response>;
}

export async function loadSvgDataUri(assets: OgAssets, path: string): Promise<string> {
    const response = await assets.fetch(new Request(`https://assets.local${path}`));
    const text = await response.text();
    let binary = '';
    for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);

    return `data:image/svg+xml;base64,${btoa(binary)}`;
}

export async function loadImageDataUri(assets: OgAssets, path: string, mime = 'image/png'): Promise<string> {
    const response = await assets.fetch(new Request(`https://assets.local${path}`));
    const buffer = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (const byte of buffer) binary += String.fromCharCode(byte);

    return `data:${mime};base64,${btoa(binary)}`;
}

/** Load one of the site's own static image assets (e.g. chain icons) as a data URI. */
export function loadStaticImageDataUri(assets: OgAssets, path: string): Promise<string> {
    const mime = path.endsWith('.jpg') || path.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
    return loadImageDataUri(assets, path, mime);
}

/**
 * Fonts come from the worker's own static assets (via the ASSETS binding)
 * instead of the (Vercel-protected) site URL.
 */
export function getOgSatoriFonts(preferences: Parameters<typeof getSatoriFonts>[0], origin: string, assets: OgAssets) {
    return getSatoriFonts(preferences, undefined, origin, (url) =>
        assets.fetch(new Request(url)).then((response: Response) => response.arrayBuffer()),
    );
}
