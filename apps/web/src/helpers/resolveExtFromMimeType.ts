import { createLookupTableResolver } from '@dimensiondev/utils';

import { FileMimeType } from '@/constants/enum.js';

export const resolveExtFromMimeType = createLookupTableResolver<FileMimeType, string>(
    {
        [FileMimeType.MP4]: 'mp4',
        [FileMimeType.MOV]: 'mov',
        [FileMimeType.GIF]: 'gif',
        [FileMimeType.JPEG]: 'jpeg',
        [FileMimeType.PNG]: 'png',
        [FileMimeType.WEBP]: 'webp',
        [FileMimeType.BMP]: 'bmp',
        [FileMimeType.GPP]: 'gpp',
        [FileMimeType.MPEG]: 'mpeg',
        [FileMimeType.MS_VIDEO]: 'ms_video',
        [FileMimeType.OGG]: 'ogg',
        [FileMimeType.WEBM]: 'webm',
        [FileMimeType.GPP2]: 'gpp2',
    },
    (type) => {
        throw new Error(`Cannot resolve extension from mime type: ${type}`);
    },
);
