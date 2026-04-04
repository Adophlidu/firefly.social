import { compact } from 'lodash-es';

import { fetch } from '@/helpers/fetch.js';
import { logger } from '@/libs/Logger.js';

// Use require to avoid Turbopack build issues with native modules
// This ensures the module is only loaded at runtime, not during build
function getTransformer() {
    const { Transformer } = require('@napi-rs/image');
    return Transformer;
}

function isActuallyPng(buffer: Buffer): boolean {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    return buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
}

async function fetchAndTransform(imageUrl: string) {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Sometimes, even though the image has a png extension and the content-type also returns png, the image is actually jpeg. This will cause the transform to fail.
        if (isActuallyPng(buffer)) return `data:image/png;base64,${buffer.toString('base64')}`;

        const Transformer = getTransformer();
        const tf = new Transformer(buffer);
        const pngBuffer = await tf.png();
        return `data:image/png;base64,${pngBuffer.toString('base64')}`;
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
