import { Source } from '@dimensiondev/enums';

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

    const sourceFromPath = url.pathname.split('/')[2];
    const source =
        resolveSourceFromUrlNoFallback(url.searchParams.get('source')) ||
        (sourceFromPath === 'polymarket'
            ? Source.Prediction
            : fixFollowingSource(resolveSourceFromUrlNoFallback(sourceFromPath)));

    if (!source || !isFollowingSource(source)) return null;

    return { source };
}
