import { queryOptions } from '@tanstack/react-query';
import { type Address } from 'viem';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPolymarketProfileListQueryOptions(wallet?: Address, isPolymarketProxy = false) {
    return queryOptions({
        queryKey: ['polymarket-profile-list', wallet?.toLowerCase(), isPolymarketProxy],
        queryFn() {
            return getFireflyEndpoint().getPolymarketProfileList([wallet!], isPolymarketProxy);
        },
        enabled: Boolean(wallet),
        select(res) {
            return res?.[0] ?? null;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
