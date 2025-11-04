import { useQuery } from '@tanstack/react-query';

import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useCollectionMarketInfo(chainId: number | undefined, contractAddress: string | undefined) {
    return useQuery({
        queryKey: ['collection', 'market-info', chainId, contractAddress],
        queryFn: async () => {
            if (!chainId || !contractAddress) return;
            return fireflyEndpointProvider.getCollectionStatistics(chainId, contractAddress);
        },
    });
}
