import type { SocialSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';

import {
    MAX_GIF_SIZE_PER_POST,
    MAX_GIF_SIZE_PRO_PER_POST,
    MAX_IMAGE_SIZE_PER_POST,
    MAX_IMAGE_SIZE_PRO_PER_POST,
    MAX_VIDEO_SIZE_PER_POST,
    MAX_VIDEO_SIZE_PRO_PER_POST,
} from '@/constants/limitation.js';
import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import type { ComposeType } from '@/types/compose.js';

export function getCurrentPostImageLimits(type: ComposeType, availableSources: SocialSource[]) {
    if (availableSources.length === 0) {
        const profile = getCurrentProfileFromStorage(Source.Farcaster);
        const config = profile?.isProUser ? MAX_IMAGE_SIZE_PRO_PER_POST : MAX_IMAGE_SIZE_PER_POST;
        return config[Source.Farcaster];
    }
    return Math.min(
        ...availableSources.map((source) => {
            const profile = getCurrentProfileFromStorage(source);
            const max = profile?.isProUser ? MAX_IMAGE_SIZE_PRO_PER_POST[source] : MAX_IMAGE_SIZE_PER_POST[source];
            return source === Source.Farcaster && type === 'quote' ? max - 1 : max;
        }),
    );
}

export function getCurrentPostVideoLimits(availableSources: SocialSource[]) {
    if (availableSources.length === 0) {
        const profile = getCurrentProfileFromStorage(Source.Farcaster);
        const config = profile?.isProUser ? MAX_VIDEO_SIZE_PRO_PER_POST : MAX_VIDEO_SIZE_PER_POST;
        return config[Source.Farcaster];
    }
    return Math.min(
        ...availableSources.map((source) => {
            const profile = getCurrentProfileFromStorage(source);
            const max = profile?.isProUser ? MAX_VIDEO_SIZE_PRO_PER_POST[source] : MAX_VIDEO_SIZE_PER_POST[source];
            return max;
        }),
    );
}

export function getCurrentPostGifLimits(availableSources: SocialSource[]) {
    if (availableSources.length === 0) {
        const profile = getCurrentProfileFromStorage(Source.Farcaster);
        const config = profile?.isProUser ? MAX_GIF_SIZE_PRO_PER_POST : MAX_GIF_SIZE_PER_POST;
        return config[Source.Farcaster];
    }

    return Math.min(
        ...availableSources.map((source) => {
            const profile = getCurrentProfileFromStorage(source);
            const config = profile?.isProUser ? MAX_GIF_SIZE_PRO_PER_POST : MAX_GIF_SIZE_PER_POST;
            return config[source];
        }),
    );
}
