import urlcat from 'urlcat';

import { type SocialSource } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { SITE_HOSTNAME } from '@/constants/static.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

const FIREFLY_POST_URL_PATTERN = /^\/post\/([^/]+)$/;

export function formatFireflyPostUrl(source: SocialSource, articleId: string): string {
    if (!articleId) return '';

    return urlcat(env.external.NEXT_PUBLIC_SITE_URL, '/post/:id', {
        id: articleId,
        s: resolveSourceInUrl(source),
    });
}

export function isFireflyPostUrl(url: string): boolean {
    if (!url) return false;

    try {
        const urlObj = new URL(url);
        if (!urlObj.hostname.includes(SITE_HOSTNAME)) {
            return false;
        }

        return FIREFLY_POST_URL_PATTERN.test(urlObj.pathname) && !!urlObj.searchParams.get('s');
    } catch {
        return false;
    }
}

export function extractArticleIdFromUrl(url: string): string | null {
    if (!isFireflyPostUrl(url)) return null;

    try {
        const urlObj = new URL(url);
        const match = urlObj.pathname.match(FIREFLY_POST_URL_PATTERN);
        return match?.[1] || null;
    } catch {
        return null;
    }
}
