/* cspell:disable */

import type { Font, FontStyle, FontWeight } from 'satori';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/static.js';
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

export async function getSatoriFonts(
    preferences: 'all' | Array<(typeof FONT_CONFIGS)[0]['name']> = 'all',
    signal?: AbortSignal,
): Promise<Font[]> {
    const configs =
        preferences === 'all' ? FONT_CONFIGS : FONT_CONFIGS.filter((config) => preferences.includes(config.name));

    const fonts = await Promise.all(
        configs.map((config) =>
            fetchArrayBuffer(config.url, {
                cache: 'force-cache',
                signal,
            }),
        ),
    );

    return configs.map<Font>((config, index) => ({
        ...config,
        data: fonts[index],
    }));
}
