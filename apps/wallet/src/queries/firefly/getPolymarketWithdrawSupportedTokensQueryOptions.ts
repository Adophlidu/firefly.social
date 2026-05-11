import { queryOptions } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPolymarketWithdrawSupportedTokensQueryOptions() {
    return queryOptions({
        queryKey: ['polymarket-withdraw-supported-tokens'],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketWithdrawSupportedTokens();
        },
        staleTime: 1000 * 60 * 30,
    });
}
