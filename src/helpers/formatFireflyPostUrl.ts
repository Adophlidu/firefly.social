import { envs } from '@dimensiondev/envs';
import urlcat from 'urlcat';

import { type SocialSource } from '@/constants/enum.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function formatFireflyPostUrl(source: SocialSource, articleId: string): string {
    if (!articleId) return '';

    return urlcat(envs.external.NEXT_PUBLIC_SITE_URL, '/post/:id', {
        id: articleId,
        s: resolveSourceInUrl(source),
    });
}
