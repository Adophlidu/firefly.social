import { useQuery } from '@tanstack/react-query';

import { NetworkType } from '@/constants/enum.js';
import { getNativeToken } from '@/helpers/getNativeToken.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { CoinGecko } from '@/providers/coingecko/index.js';

export function useNativeTokenPrice(override?: ChainContextOverrides, enabled = true) {
    const { chainId } = useChainContext(override);

    return useQuery({
        enabled,
        staleTime: 1000 * 60 * 2, // 2 minutes
        queryKey: ['native-token', 'price', chainId],
        queryFn: async () => {
            const nativeToken = getNativeToken(override?.networkType ?? NetworkType.Ethereum, chainId);
            return CoinGecko.getFungibleTokenPrice(chainId, nativeToken.address);
        },
    });
}
