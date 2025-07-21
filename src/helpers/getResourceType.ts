import { parseUrl } from '@/helpers/parseUrl.js';
import { isValidPollFrameUrl } from '@/helpers/resolveEmbedMediaType.js';

export function getResourceType(urlString: string) {
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

    if (['png', 'jpeg', 'gif', 'webp', 'bmp', 'jpg'].includes(fileExtension)) {
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
