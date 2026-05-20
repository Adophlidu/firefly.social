import type { SocialSource } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function formatFireflyPostUrl(source: SocialSource, articleId: string): string {
    if (!articleId) return '';

    return urlcat(envs.external.NEXT_PUBLIC_SITE_URL, '/post/:id', {
        id: articleId,
        s: resolveSourceInUrl(source),
    });
}
