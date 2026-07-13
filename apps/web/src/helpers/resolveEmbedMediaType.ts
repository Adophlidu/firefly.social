import { FRAME_DEV_SERVER_URL, FRAME_SERVER_URL } from '@dimensiondev/constants/static';
import { AttachmentType } from '@dimensiondev/enums';
import { parseUrl, safeUnreachable } from '@dimensiondev/utils';

import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isSameOriginUrl } from '@/helpers/isSameOriginUrl.js';
import { EmbedMediaType } from '@/providers/types/Firefly.js';

const frameDomains = [
    FRAME_SERVER_URL,
    FRAME_DEV_SERVER_URL,
    'https://polls.mask.social',
    'https://polls.firefly.social',
    'https://polls-canary.firefly.social',
];

function getResourceType(urlString: string) {
    const parsedURL = parseUrl(urlString);
    if (!parsedURL) return;

    let fileExtension = parsedURL?.pathname.split('.').pop()?.toLowerCase();
    if (!fileExtension) return;

    // TODO Temporary solution for https://mask.atlassian.net/browse/FW-755
    // media.tenor.com is a CDN for GIFs, but it doesn't have a file extension.
    if (['imagedelivery.net', 'media.tenor.com', 'tba-social.mypinata.cloud'].includes(parsedURL.hostname)) {
        return AttachmentType.Image;
    }

    if (['supercast.mypinata.cloud', 'cloudflare-ipfs.com'].includes(parsedURL.hostname)) {
        const fileName = parsedURL.searchParams.get('filename');
        const extension = fileName?.split('.').pop()?.toLowerCase();
        if (extension) fileExtension = extension;
    }

    if (parsedURL.hostname === 'takocdn.xyz' && parsedURL.pathname.startsWith('/images/')) {
        return AttachmentType.Image;
    }

    if (['png', 'jpeg', 'gif', 'webp', 'bmp', 'jpg', 'heic', 'heif'].includes(fileExtension)) {
        return AttachmentType.Image;
    } else if (['mp4', 'webm', 'ogg', 'm3u8', 'mov'].includes(fileExtension)) {
        return AttachmentType.Video;
    } else if (['mp3'].includes(fileExtension)) {
        return AttachmentType.Audio;
    } else if (isValidPollFrameUrl(parsedURL.origin)) {
        return AttachmentType.Poll;
    }
    return;
}

export function isValidPollFrameUrl(url: string): boolean {
    if (!frameDomains.some((domain) => isSameOriginUrl(url, domain))) return false;
    const parsed = parseUrl(url);
    if (!parsed) return false;

    return isRoutePathname(parsed.pathname, '/polls/:id', true);
}

export function resolveEmbedMediaType(url: string, type?: EmbedMediaType) {
    if (!type) return getResourceType(url);

    switch (type) {
        case EmbedMediaType.IMAGE:
            return AttachmentType.Image;
        case EmbedMediaType.AUDIO:
            if (url.includes('m3u8')) return AttachmentType.Video;
            return AttachmentType.Audio;
        case EmbedMediaType.VIDEO:
            return AttachmentType.Video;
        case EmbedMediaType.UNKNOWN:
            return AttachmentType.Unknown;
        case EmbedMediaType.FRAME:
            if (isValidPollFrameUrl(url)) return AttachmentType.Poll;
            return;
        case EmbedMediaType.APPLICATION:
        case EmbedMediaType.CAST:
        case EmbedMediaType.TEXT:
        case EmbedMediaType.NFT:
        case EmbedMediaType.FONT:
            return;
        default:
            safeUnreachable(type);
            return;
    }
}
