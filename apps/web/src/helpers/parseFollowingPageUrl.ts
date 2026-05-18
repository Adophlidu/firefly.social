import { type FollowingSource, PageRoute } from '@dimensiondev/enums';

import { FOLLOWING_SOURCES } from '@/constants/computed.js';
import { matchPath } from '@/helpers/matchPath.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseFollowingPageUrl(pathname: string) {
    const matched = matchPath(PageRoute.Following, pathname, true);
    if (!matched) return null;
    const source = resolveSourceFromUrlNoFallback(matched.source);
    if (!source || !FOLLOWING_SOURCES.includes(source as FollowingSource)) return null;
    return { source };
}
