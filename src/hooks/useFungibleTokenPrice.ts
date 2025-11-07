import { useQuery } from '@tanstack/react-query';

import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { getFungibleTokenPrice } from '@/providers/coingecko/getFungibleTokenPrice.js';

export function useFungibleTokenPrice(address?: string, override?: ChainContextOverrides) {
    const { chainId } = useChainContext(override);

    return useQuery({
        enabled: !!address,
        queryKey: ['fungible', 'token-price', chainId, address],
        queryFn: async () => (address ? getFungibleTokenPrice(chainId, address) : 0),
    });
}
