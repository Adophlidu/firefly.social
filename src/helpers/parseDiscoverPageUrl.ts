import { PageRoute, Source } from '@/constants/enum.js';
import { matchPath } from '@/helpers/matchPath.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseDiscoverPageUrl(pathname: string) {
    const matched = matchPath(PageRoute.Discover, pathname, true);
    if (!matched) return null;
    return { source: resolveSourceFromUrlNoFallback(matched.source) ?? Source.Posts };
}
