import { SITE_URL } from '@dimensiondev/envs/web';
import type { Font, FontStyle, FontWeight } from 'satori';
import urlcat from 'urlcat';

import { fetchArrayBuffer } from '@/helpers/fetchArrayBuffer.js';

interface FontConfig {
    name: string;
    url: string;
    weight?: FontWeight;
    style?: FontStyle;
}

const FONT_CONFIGS: FontConfig[] = [
    { name: 'Inter', url: urlcat(SITE_URL, '/font/Inter-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'Inter', url: urlcat(SITE_URL, '/font/Inter-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'NotoSans', url: urlcat(SITE_URL, '/font/NotoSans-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'NotoSansSC', url: urlcat(SITE_URL, '/font/NotoSansSC-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'NotoSansSC', url: urlcat(SITE_URL, '/font/NotoSansSC-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'NotoSans', url: urlcat(SITE_URL, '/font/NotoSans-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'Bedstead', url: urlcat(SITE_URL, '/font/Bedstead-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'Bedstead', url: urlcat(SITE_URL, '/font/Bedstead-Bold.ttf'), weight: 700, style: 'normal' },
    { name: 'Noto Sans Symbols 2', url: urlcat(SITE_URL, '/font/NotoSansSymbols2-Regular.ttf') },
];

// Memoize in module scope: avoids Next.js's 2 MB fetch data-cache limit (the
// NotoSans TTFs are ~22 MB) and keeps the buffers resident across warm invocations.
const fontBufferCache = new Map<string, Promise<ArrayBuffer>>();

function loadOgFont(
    url: string,
    signal?: AbortSignal,
    fetchBuffer?: (url: string) => Promise<ArrayBuffer>,
): Promise<ArrayBuffer> {
    const cached = fontBufferCache.get(url);
    if (cached) return cached;

    const buffer = (fetchBuffer ? fetchBuffer(url) : fetchArrayBuffer(url, { signal })).catch((error: unknown) => {
        // Drop rejected promises so the next render retries.
        fontBufferCache.delete(url);
        throw error;
    });
    fontBufferCache.set(url, buffer);
    return buffer;
}

export async function getSatoriFonts(
    preferences: 'all' | Array<(typeof FONT_CONFIGS)[0]['name']> = 'all',
    signal?: AbortSignal,
    /** Base URL to resolve font files against (defaults to the site URL).
        The SSR worker passes the request origin so fonts come from its own
        assets instead of the (Vercel-protected) site URL. */
    baseUrl?: string,
    /** Custom font fetcher (e.g. the ASSETS binding on Workers). */
    fetchBuffer?: (url: string) => Promise<ArrayBuffer>,
): Promise<Font[]> {
    const configs = (
        preferences === 'all' ? FONT_CONFIGS : FONT_CONFIGS.filter((config) => preferences.includes(config.name))
    ).map((config) =>
        baseUrl ? { ...config, url: new URL(new URL(config.url).pathname, baseUrl).toString() } : config,
    );

    const fonts = await Promise.all(configs.map((config) => loadOgFont(config.url, signal, fetchBuffer)));

    return configs.map<Font>((config, index) => ({
        name: config.name,
        weight: config.weight,
        style: config.style,
        data: fonts[index],
    }));
}
