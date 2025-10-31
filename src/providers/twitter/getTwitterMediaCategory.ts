import { safeUnreachable } from '@dimensiondev/utils';
import type { UploadMediaV1Params } from 'twitter-api-v2';

import { FileMimeType } from '@/constants/enum.js';

export function getTwitterMediaCategory(
    type: FileMimeType,
    target: 'tweet' | 'dm',
    options?: Partial<UploadMediaV1Params>,
) {
    if (type === FileMimeType.MP4 && options?.longVideo) {
        return 'amplify_video';
    }

    switch (type) {
        case FileMimeType.MP4:
        case FileMimeType.MOV:
            return target === 'tweet' ? 'tweet_video' : 'dm_video';
        case FileMimeType.GIF:
            return target === 'tweet' ? 'tweet_gif' : 'dm_image';
        case FileMimeType.JPEG:
        case FileMimeType.PNG:
        case FileMimeType.WEBP:
            return target === 'tweet' ? 'tweet_image' : 'dm_image';
        case FileMimeType.BMP:
        case FileMimeType.GPP:
        case FileMimeType.MPEG:
        case FileMimeType.MS_VIDEO:
        case FileMimeType.OGG:
        case FileMimeType.WEBM:
        case FileMimeType.GPP2:
            return;
        default:
            safeUnreachable(type);
            return;
    }
}
