import { queryOptions } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPolymarketAccountQueryOptions() {
    return queryOptions({
        queryKey: ['getPolymarketAccount'],
        async queryFn() {
            return getFireflyEndpoint().getPolymarketAccount();
        },
        retry: 0,
        retryOnMount: false,
    });
}
