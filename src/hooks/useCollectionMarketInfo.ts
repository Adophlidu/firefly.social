import { useQuery } from '@tanstack/react-query';

import { getCollectionStatistics } from '@/providers/firefly/nft/getCollectionStatistics.js';

export function useCollectionMarketInfo(chainId: number | undefined, contractAddress: string | undefined) {
    return useQuery({
        queryKey: ['collection', 'market-info', chainId, contractAddress],
        queryFn: async () => {
            if (!chainId || !contractAddress) return;
            return getCollectionStatistics(chainId, contractAddress);
        },
    });
}
