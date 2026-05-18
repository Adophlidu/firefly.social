import type { DiscoverSource } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolveSourceInUrl } from '@/helpers/resolveSourceInUrl.js';

export function resolveDiscoverUrl(source: DiscoverSource) {
    return urlcat(`/:source`, {
        source: resolveSourceInUrl(source),
    });
}
