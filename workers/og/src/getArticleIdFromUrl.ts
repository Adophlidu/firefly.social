import { Md5 } from '@dimensiondev/workers-shared/helpers/md5.js';
import type { Context } from 'hono';

import { getParagraphArticleIdWithLink } from '@/og/src/getParagraphArticleIdWithLink.js';

export const PARAGRAPH_ARTICLE_REGEXP = /https?:\/\/paragraph\.xyz(\/view)?\/@([^/]+)\/(.+)/;
export const MIRROR_SUBDOMAIN_ARTICLE_REGEXP = /^https:\/\/.*\.mirror\.xyz\/(.*)$/;
export const MIRROR_ARTICLE_REGEXP = /https?:\/\/mirror\.xyz\/[^/]+\/([^/]+)/;
export const LIMO_REGEXP = /^https:\/\/vitalik\.eth\.limo\/general\//;

export async function getArticleIdFromUrl(url: string, c: Context) {
    if (url.startsWith('https://vitalik.eth.limo/general/')) {
        return Md5.hashStr(url);
    }
    if (MIRROR_ARTICLE_REGEXP.test(url)) {
        return url.match(MIRROR_ARTICLE_REGEXP)?.[1];
    }

    if (MIRROR_SUBDOMAIN_ARTICLE_REGEXP.test(url)) {
        return url.match(MIRROR_SUBDOMAIN_ARTICLE_REGEXP)?.[1];
    }

    if (PARAGRAPH_ARTICLE_REGEXP.test(url)) {
        return getParagraphArticleIdWithLink(url.replace('/view/', '/'), c);
    }
    return;
}
