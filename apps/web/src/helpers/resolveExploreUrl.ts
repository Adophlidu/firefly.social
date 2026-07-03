import { EXPLORE_DEFAULT_SOURCE } from '@dimensiondev/constants/computed';
import type { ExploreSource } from '@dimensiondev/enums';
import { ExploreType } from '@dimensiondev/enums';
import urlcat from 'urlcat';

import { resolveExploreSourceInURL } from '@/helpers/resolveSourceInUrl.js';
import { RouteResolver } from '@/helpers/RouteResolver.js';

export function resolveExploreUrl(explore: ExploreType, source?: ExploreSource) {
    if (source) {
        return urlcat(`/explore/:explore/:source`, {
            explore,
            source: resolveExploreSourceInURL(source),
        });
    }

    // Prediction has no static default source (its categories are dynamic slugs), so it would
    // otherwise fall through to the source-less /explore/prediction route. That route server-blocks
    // on getEventSlugList and then redirects to /explore/prediction/:source, which flashes a blank
    // frame on soft navigation. Point straight at the canonical `trending` category instead: one
    // navigation, no redirect, and the URL still carries a source (nav highlight + metadata intact).
    if (explore === ExploreType.Prediction) {
        return RouteResolver.explorePrediction({ appendRoot: false });
    }

    const target = EXPLORE_DEFAULT_SOURCE[explore];
    if (!target) return urlcat('/explore/:explore', { explore });
    return urlcat(`/explore/:explore/:source`, {
        explore,
        source: resolveExploreSourceInURL(target),
    });
}
