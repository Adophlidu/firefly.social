import { useQuery } from '@tanstack/react-query';

import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useCollectionMarketInfo(chainId: number | undefined, contractAddress: string | undefined) {
    return useQuery({
        queryKey: ['collection', 'market-info', chainId, contractAddress],
        queryFn: async () => {
            if (!chainId || !contractAddress) return;
            return FireflyEndpointProvider.getCollectionStatistics(chainId, contractAddress);
        },
    });
}
