import urlcat from 'urlcat';

import { PageRoute, type SocialSource } from '@/constants/enum.js';
import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolvePostUrl(source: SocialSource, id: string) {
    if (!id) return '';

    return urlcat(PageRoute.PostDetail, { source: resolveSourceInUrl(source), id });
}
