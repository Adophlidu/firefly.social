import { useQuery } from '@tanstack/react-query';

import { fireflyNftProvider } from '@/providers/firefly/Nft.js';

export function useCollectionMarketInfo(chainId: number | undefined, contractAddress: string | undefined) {
    return useQuery({
        queryKey: ['collection', 'market-info', chainId, contractAddress],
        queryFn: async () => {
            if (!chainId || !contractAddress) return;
            return fireflyNftProvider.getCollectionStatistics(chainId, contractAddress);
        },
    });
}
