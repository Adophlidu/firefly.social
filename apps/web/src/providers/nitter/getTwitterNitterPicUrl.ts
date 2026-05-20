import { FIREFLY_NITTER_URL } from '@dimensiondev/constants/static';
import urlcat from 'urlcat';

function removePrefix(s: string, prefix: string): string {
    if (s.startsWith(prefix) && prefix.length > 0) {
        return s.slice(prefix.length);
    }
    return s;
}

const HTTPS_PREFIX = 'https://';
const TW_IMG_PREFIX = 'pbs.twimg.com/';

function resolveLink(link: string) {
    return removePrefix(removePrefix(link, HTTPS_PREFIX), TW_IMG_PREFIX);
}

export function getTwitterNitterPicUrl(link: string) {
    if (!link) return link;
    return urlcat(FIREFLY_NITTER_URL, '/pic/:link', {
        link: resolveLink(link),
    });
}

export function getTwitterNitterPicOrigUrl(link: string) {
    if (!link) return link;
    return urlcat(FIREFLY_NITTER_URL, '/pic/orig/:link', {
        link: resolveLink(link),
    });
}
