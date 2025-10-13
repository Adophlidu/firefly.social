import { Source } from '@/constants/enum.js';
import { isFollowingSource } from '@/helpers/isSource.js';
import { resolveSourceFromUrlNoFallback } from '@/helpers/resolveSource.js';

function fixFollowingSource(source: Source | null) {
    if (!source) return null;

    switch (source) {
        case Source.Swap:
        case Source.NFTs:
            return Source.Transactions;
        case Source.Article:
        case Source.DAOs:
            return Source.Activities;
        default:
            return null;
    }
}

export function parseOldFollowingUrl(url: URL) {
    if (!url.pathname.startsWith('/following')) return null;

    const source =
        resolveSourceFromUrlNoFallback(url.searchParams.get('source')) ||
        fixFollowingSource(resolveSourceFromUrlNoFallback(url.pathname.split('/')[2]));

    if (!source || !isFollowingSource(source)) return null;

    return { source };
}
