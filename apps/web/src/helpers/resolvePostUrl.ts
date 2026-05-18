import type { SocialSource } from '@dimensiondev/enums';
import { PageRoute } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolvePostUrl(source: SocialSource, id: string) {
    if (!id) return '';

    return urlcat(PageRoute.PostDetail, { source: resolveSourceInUrl(source), id });
}
