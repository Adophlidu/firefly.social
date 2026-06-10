import { FileMimeType } from '@dimensiondev/enums';

import { createLocalMediaObject } from '@/helpers/resolveMediaObjectUrl.js';
import type { MediaObject } from '@/types/compose.js';

/**
 * Fetches a remote image (e.g. the FW-7696 position share image) into a local MediaObject so it
 * can be attached to the compose editor like a user-selected file.
 */
export async function fetchImageAsMediaObject(url: string, fileName = 'image.png'): Promise<MediaObject> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image (${response.status}): ${url}`);
    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type || FileMimeType.PNG });
    return createLocalMediaObject(file);
}
