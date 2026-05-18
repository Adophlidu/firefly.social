import type { FollowingSource } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveFollowingUrl(source: FollowingSource) {
    return urlcat(`/following/:source`, {
        source: resolveSourceInUrl(source),
    });
}
