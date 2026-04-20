import { isSameSolanaChainId } from '@dimensiondev/web3/chains';
import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';

import { createSwapEndpoint } from '@/providers/swap/swapEndpoint.js';

interface Options {
    address?: string;
    chainId?: number;
}

export function useSwapTokenDetail({ address, chainId }: Options) {
    return useQuery({
        queryKey: ['swap-token-detail', address, chainId],
        queryFn: async () => {
            if (!address || !chainId) return null;
            const endpoint = createSwapEndpoint();
            const results = await endpoint.getTokenDetailBatch([{ chainId: String(chainId), address }]);
            return (
                results.find((t) => {
                    return isSameSolanaChainId(t.chainId, chainId) && isNativeTokenOrSameAddress(t.address, address);
                }) ?? null
            );
        },
        enabled: !!address && !!chainId,
        staleTime: 30 * 60 * 1000,
    });
}
