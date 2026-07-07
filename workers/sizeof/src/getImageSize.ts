import { fetchWithContext } from '@dimensiondev/workers-shared/helpers/fetchWithContext.js';
import type { Context } from 'hono';
import { imageSize } from 'image-size';

import type { ImageDigested } from '@/sizeof/src/types.js';

/**
 * Get the size of an image from a base64 string
 * @param base64 The base64 string of the image
 * @returns The width and height of the image
 */
export async function getImageSizeFromBase64(base64: string): Promise<ImageDigested> {
    // Remove data URI prefix if present
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    const binary = atob(base64Data ?? '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const result = imageSize(bytes);
    if (!result?.width || !result.height) throw new Error('Unable to determine image size from base64');

    return {
        width: result.width,
        height: result.height,
    };
}

export async function getImageSizeFromUrl(url: string, c: Context): Promise<ImageDigested> {
    // Fetch the image and use image-size on the buffer
    const response = await fetchWithContext(url, { context: c });
    if (!response.ok) throw new Error(`Unable to fetch image for size detection: ${url} ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const result = imageSize(bytes);
    if (!result?.width || !result.height) throw new Error('Unable to determine image size from URL');

    return {
        width: result.width,
        height: result.height,
    };
}
