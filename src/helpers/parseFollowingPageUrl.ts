import { PageRoute } from '@/constants/enum.js';
import { isFollowingSource } from '@/helpers/isFollowingSource.js';
import { matchPath } from '@/helpers/matchPath.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseFollowingPageUrl(pathname: string) {
    const matched = matchPath(PageRoute.Following, pathname, true);
    if (!matched) return null;
    const source = resolveSourceFromUrlNoFallback(matched.source);
    if (!source || !isFollowingSource(source)) return null;
    return { source };
}
