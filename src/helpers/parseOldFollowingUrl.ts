import { PageRoute } from '@/constants/enum.js';
import { isDiscoverSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

export function parseOldFollowingUrl(url: URL) {
    if (!url.pathname.startsWith(PageRoute.Following)) return null;
    const source = resolveSourceFromUrlNoFallback(url.searchParams.get('source'));

    if (!source || !isDiscoverSource(source)) return null;

    return { source };
}
