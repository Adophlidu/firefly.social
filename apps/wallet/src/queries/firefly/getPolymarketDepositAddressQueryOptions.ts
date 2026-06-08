import { queryOptions } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPolymarketDepositAddressQueryOptions() {
    return queryOptions({
        queryKey: ['polymarket-deposit-address'],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketDepositAddress();
        },
        staleTime: 1000 * 60 * 5,
    });
}
