import { queryOptions } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPolymarketDepositSupportedTokensQueryOptions() {
    return queryOptions({
        queryKey: ['polymarket-deposit-supported-tokens'],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketDepositSupportedTokens();
        },
        staleTime: 1000 * 60 * 30,
    });
}
