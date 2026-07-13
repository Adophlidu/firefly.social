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
// NotoSans TTFs are ~22 MB) and stays edge-compatible (/api/rp is runtime: edge).
const fontBufferCache = new Map<string, Promise<ArrayBuffer>>();

function loadOgFont(url: string, signal?: AbortSignal): Promise<ArrayBuffer> {
    const cached = fontBufferCache.get(url);
    if (cached) return cached;

    const buffer = fetchArrayBuffer(url, { signal }).catch((error: unknown) => {
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
): Promise<Font[]> {
    const configs =
        preferences === 'all' ? FONT_CONFIGS : FONT_CONFIGS.filter((config) => preferences.includes(config.name));

    const fonts = await Promise.all(configs.map((config) => loadOgFont(config.url, signal)));

    return configs.map<Font>((config, index) => ({
        name: config.name,
        weight: config.weight,
        style: config.style,
        data: fonts[index],
    }));
}
