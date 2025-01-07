import { PageRoute, Source } from '@/constants/enum.js';
import { matchPath } from '@/helpers/matchPath.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseFollowingPageUrl(pathname: string) {
    const matched = matchPath(PageRoute.Following, pathname, true);
    if (!matched) return null;
    return { source: resolveSourceFromUrlNoFallback(matched.source) ?? Source.Posts };
}
