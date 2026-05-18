import type { SocialSource } from '@dimensiondev/enums';

import {
    getPostVideoDurationMax,
    getPostVideoDurationMin,
    getPostVideoHeightMax,
    getPostVideoHeightMin,
    getPostVideoWidthMax,
    getPostVideoWidthMin,
} from '@/helpers/getPostLimitation.js';
import type { VideoMetadata } from '@/types/compose.js';

export function validateVideoDuration(availableSources: SocialSource[], { duration }: VideoMetadata) {
    const minDuration = getPostVideoDurationMin(availableSources);
    const maxDuration = getPostVideoDurationMax(availableSources);

    return {
        isValid: duration >= minDuration && duration <= maxDuration,
        duration,
        minDuration,
        maxDuration,
    };
}

export function validateVideoSize(availableSources: SocialSource[], { width, height }: VideoMetadata) {
    const minWidth = getPostVideoWidthMin(availableSources);
    const maxWidth = getPostVideoWidthMax(availableSources);
    const minHeight = getPostVideoHeightMin(availableSources);
    const maxHeight = getPostVideoHeightMax(availableSources);

    return {
        isValid: width >= minWidth && width <= maxWidth && height >= minHeight && height <= maxHeight,
        width,
        height,
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
    };
}
