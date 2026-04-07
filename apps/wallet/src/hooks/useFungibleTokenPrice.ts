import { useQuery } from '@tanstack/react-query';

import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { coinGeckoEndpoint } from '@/providers/coingecko/index.js';

export function useFungibleTokenPrice(address?: string, override?: ChainContextOverrides) {
    const { chainId } = useChainContext(override);

    return useQuery({
        enabled: !!address,
        queryKey: ['fungible', 'token-price', chainId, address?.toLowerCase()],
        queryFn: async () => (address ? coinGeckoEndpoint.getFungibleTokenPrice(chainId, address) : 0),
    });
}
