import { parseUrl } from '@/helpers/parseUrl.js';
import { isValidPollFrameUrl } from '@/helpers/resolveEmbedMediaType.js';

export function getPollIdFromLink(url: string) {
    if (!isValidPollFrameUrl(url)) return;

    const parsed = parseUrl(url);
    return parsed?.pathname.split('/')[2];
}
