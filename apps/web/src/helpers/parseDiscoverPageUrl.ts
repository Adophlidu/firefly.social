import { PageRoute } from '@dimensiondev/enums';

import { isRoutePathname } from '@/helpers/isRoutePathname.js';
import { isDiscoverSource } from '@/helpers/isSource.js';
import { matchPath } from '@/helpers/matchPath.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseDiscoverPageUrl(pathname: string) {
    if (isRoutePathname(pathname, PageRoute.PredictionCategory)) return null;
    const matched = matchPath(PageRoute.Discover, pathname, true);
    if (!matched) return null;
    const source = resolveSourceFromUrlNoFallback(matched.source);
    if (!source || !isDiscoverSource(source)) return null;
    return { source };
}
