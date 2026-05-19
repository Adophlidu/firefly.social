import { EXPLORE_DEFAULT_SOURCE } from '@dimensiondev/constants/computed';
import type { ExploreSource, ExploreType } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolveExploreSourceInURL } from '@/helpers/resolveSourceInUrl.js';

export function resolveExploreUrl(explore: ExploreType, source?: ExploreSource) {
    if (source) {
        return urlcat(`/explore/:explore/:source`, {
            explore,
            source: resolveExploreSourceInURL(source),
        });
    }

    const target = EXPLORE_DEFAULT_SOURCE[explore];
    if (!target) return urlcat('/explore/:explore', { explore });
    return urlcat(`/explore/:explore/:source`, {
        explore,
        source: resolveExploreSourceInURL(target),
    });
}
