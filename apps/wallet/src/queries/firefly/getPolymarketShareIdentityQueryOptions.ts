import { PredictionPlatform } from '@dimensiondev/enums';
import { queryOptions } from '@tanstack/react-query';
import type { Address } from 'viem';

import { resolveShareIdentityFromProfile } from '@/helpers/polymarketShareImage.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

/**
 * Resolves the connected wallet's Polymarket share-image identity (social handle + avatar) once, keyed
 * by the proxy address — every share entry point reuses the cached result. `proxyAddress` is the
 * Polymarket proxy, so the profile lookup runs with `is_polymarketProxy = true`. Uses the same source
 * (`/v2/wallet/profileinfo/list`) and priority as the web profile page (`usePredictionProfileData`).
 */
export function getPolymarketShareIdentityQueryOptions(proxyAddress?: Address) {
    return queryOptions({
        queryKey: ['polymarket-share-identity', proxyAddress?.toLowerCase()],
        enabled: Boolean(proxyAddress),
        staleTime: 5 * 60 * 1000,
        queryFn() {
            return getFireflyEndpoint().getWalletProfileInfoList(proxyAddress!, PredictionPlatform.Polymarket, true);
        },
        select(res) {
            return resolveShareIdentityFromProfile(res, proxyAddress!);
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
