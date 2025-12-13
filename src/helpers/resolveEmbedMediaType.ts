import { parseUrl } from '@dimensiondev/utils';

import { FRAME_DEV_SERVER_URL, FRAME_SERVER_URL } from '@/constants/static.js';
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
    // cspell: disable-next-line
    if (['imagedelivery.net', 'media.tenor.com', 'tba-social.mypinata.cloud'].includes(parsedURL.hostname)) {
        return 'Image';
    }

    // cspell: disable-next-line
    if (['supercast.mypinata.cloud', 'cloudflare-ipfs.com'].includes(parsedURL.hostname)) {
        const fileName = parsedURL.searchParams.get('filename');
        const extension = fileName?.split('.').pop()?.toLowerCase();
        if (extension) fileExtension = extension;
    }

    // cspell: ignore takocdn
    if (parsedURL.hostname === 'takocdn.xyz' && parsedURL.pathname.startsWith('/images/')) {
        return 'Image';
    }

    if (['png', 'jpeg', 'gif', 'webp', 'bmp', 'jpg', 'heic', 'heif'].includes(fileExtension)) {
        return 'Image';
    } else if (['mp4', 'webm', 'ogg', 'm3u8', 'mov'].includes(fileExtension)) {
        return 'Video';
    } else if (['mp3'].includes(fileExtension)) {
        return 'Audio';
    } else if (isValidPollFrameUrl(parsedURL.origin)) {
        return 'Poll';
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
            return 'Image';
        case EmbedMediaType.AUDIO:
            if (url.includes('m3u8')) return 'Video';
            return 'Audio';
        case EmbedMediaType.VIDEO:
            return 'Video';
        case EmbedMediaType.UNKNOWN:
            return 'Unknown';
        default:
            if (isValidPollFrameUrl(url)) return 'Poll';
            return;
    }
}
