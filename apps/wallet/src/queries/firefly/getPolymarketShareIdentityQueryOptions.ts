import { queryOptions } from '@tanstack/react-query';
import type { Address } from 'viem';

import { resolveShareIdentityFromProfile } from '@/helpers/polymarketShareImage.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

/**
 * Resolves the connected wallet's Polymarket share-image identity (pseudonym + avatar) once, keyed by
 * the proxy address — every share entry point reuses the cached result. `proxyAddress` is the
 * Polymarket proxy, so the profile lookup runs with `is_polymarketProxy = true`.
 */
export function getPolymarketShareIdentityQueryOptions(proxyAddress?: Address) {
    return queryOptions({
        queryKey: ['polymarket-share-identity', proxyAddress?.toLowerCase()],
        enabled: Boolean(proxyAddress),
        staleTime: 5 * 60 * 1000,
        queryFn() {
            return getFireflyEndpoint().getProfile(proxyAddress!, true);
        },
        select(res) {
            return resolveShareIdentityFromProfile(res, proxyAddress!);
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
