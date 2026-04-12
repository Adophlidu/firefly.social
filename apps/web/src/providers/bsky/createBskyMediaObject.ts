import type { BlobRef } from '@atproto/api';

import type { MediaObject } from '@/types/compose.js';

export function createBskyMediaObject(
    media: MediaObject,
    blobRef: BlobRef,
    width?: number,
    height?: number,
): MediaObject {
    return {
        ...media,
        blobRef,
        width,
        height,
    };
}
