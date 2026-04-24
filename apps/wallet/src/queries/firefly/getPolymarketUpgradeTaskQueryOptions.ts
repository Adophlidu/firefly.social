import { queryOptions } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function getPolymarketUpgradeTaskQueryOptions(proxyAddress: string | undefined) {
    return queryOptions({
        queryKey: ['polymarket-upgrade-task', proxyAddress],
        async queryFn() {
            if (!proxyAddress) return null;
            return getFireflyEndpoint().getPolymarketUpgradeTask(proxyAddress);
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
    });
}
