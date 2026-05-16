import type { Context } from 'hono';

import { getImageSizeFromBase64, getImageSizeFromUrl } from '@/sizeof/src/getImageSize.js';
import type { ImageDigested } from '@/sizeof/src/types.js';

export async function digestImageUrl(url: string, c: Context): Promise<ImageDigested | null> {
    try {
        if (url.startsWith('data:')) {
            const matched = url.match(/^data:(.*?);base64,(.*)$/);
            if (!matched) return null;

            const base64Data = matched[2];
            if (!base64Data) return null;

            return await getImageSizeFromBase64(base64Data);
        }

        if (url.startsWith('http')) {
            return await getImageSizeFromUrl(url, c);
        }

        return null;
    } catch (error) {
        console.error(`[digestImageUrl] Failed to digest image url = ${url}`, error);
        return null;
    }
}
