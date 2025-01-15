import { useQuery } from '@tanstack/react-query';

import { useNativeToken } from '@/components/RedPacket/hooks/useNativeToken.js';
import { NetworkType } from '@/constants/enum.js';
import { type ChainContextOverride, useChainContext } from '@/hooks/useChainContext.js';
import { CoinGecko } from '@/providers/coingecko/index.js';

export function useNativeTokenPrice(override?: ChainContextOverride) {
    const { chainId: chainId } = useChainContext(override);
    const nativeToken = useNativeToken(chainId, override?.networkType ?? NetworkType.Ethereum);

    return useQuery({
        queryKey: ['native-token', 'price', chainId, nativeToken.address],
        queryFn: async () => CoinGecko.getFungibleTokenPrice(chainId, nativeToken.address),
    });
}
