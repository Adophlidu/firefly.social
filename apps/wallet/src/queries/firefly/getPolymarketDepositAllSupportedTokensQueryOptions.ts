import { queryOptions } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPolymarketDepositAllSupportedTokensQueryOptions() {
    return queryOptions({
        queryKey: ['polymarket-deposit-all-supported-tokens'],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketDepositAllSupportedTokens();
        },
        staleTime: 1000 * 60 * 30,
    });
}
