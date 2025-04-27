import { useQuery } from '@tanstack/react-query';

import { NetworkType } from '@/constants/enum.js';
import { getNativeToken } from '@/helpers/getNativeToken.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { CoinGecko } from '@/providers/coingecko/index.js';

export function useNativeTokenPrice(override?: ChainContextOverrides) {
    const { chainId } = useChainContext(override);
    const nativeToken = getNativeToken(override?.networkType ?? NetworkType.Ethereum, chainId);

    return useQuery({
        queryKey: ['native-token', 'price', chainId, nativeToken.address],
        queryFn: async () => CoinGecko.getFungibleTokenPrice(chainId, nativeToken.address),
    });
}
