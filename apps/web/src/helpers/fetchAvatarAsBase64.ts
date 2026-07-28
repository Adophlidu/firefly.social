import { compact } from 'lodash-es';

import { fetch } from '@/helpers/fetch.js';
import { logger } from '@/libs/Logger.js';

const IMAGE_MAGIC: Array<{ mime: string; bytes: number[] }> = [
    { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
    { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
    { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
    { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

function detectImageMime(buffer: Uint8Array, fallback: string): string {
    for (const { mime, bytes } of IMAGE_MAGIC) {
        if (bytes.every((byte, index) => buffer[index] === byte)) return mime;
    }
    return fallback;
}

function toBase64(buffer: Uint8Array): string {
    let binary = '';
    for (const byte of buffer) binary += String.fromCharCode(byte);
    return btoa(binary);
}

async function fetchAndTransform(imageUrl: string) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;

        const buffer = new Uint8Array(await response.arrayBuffer());
        // No transcoding: satori/resvg rasterize PNG and JPEG directly, so a
        // native image library is unnecessary (and unavailable on Workers).
        const mime = detectImageMime(buffer, response.headers.get('content-type')?.split(';')[0] || 'image/png');
        return `data:${mime};base64,${toBase64(buffer)}`;
    } catch (error) {
        logger.error(`[fetchImageAsBase64] failed to fetch image as base64: url=${imageUrl}, error=${error}`);
        return null;
    }
}

export async function fetchImageAsBase64(
    imageUrl: string | undefined | null,
    fallbackImageUrl: string,
): Promise<string>;
export async function fetchImageAsBase64(
    imageUrl: string | undefined | null,
    fallbackImageUrl?: string,
): Promise<string | null>;
export async function fetchImageAsBase64(
    imageUrl: string | undefined | null,
    fallbackImageUrl?: string,
): Promise<string | null> {
    if (!imageUrl) return fallbackImageUrl ?? null;
    return (await fetchAndTransform(imageUrl)) ?? fallbackImageUrl ?? null;
}

export async function fetchImageAsBase64FromUrls(
    imageUrls: Array<string | undefined | null>,
    fallbackImageUrl?: string,
) {
    for (const imageUrl of compact(imageUrls)) {
        const base64 = await fetchImageAsBase64(imageUrl);
        if (base64) return base64;
    }

    return fallbackImageUrl ?? null;
}
