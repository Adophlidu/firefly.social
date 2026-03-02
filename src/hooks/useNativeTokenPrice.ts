import { useQuery } from '@tanstack/react-query';

import { NetworkType } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { getNativeToken } from '@/helpers/getNativeToken.js';
import { type ChainContextOverrides, useChainContext } from '@/hooks/useChainContext.js';
import { getFungibleTokenPrice } from '@/providers/coingecko/getFungibleTokenPrice.js';

export function useNativeTokenPrice(override?: ChainContextOverrides, enabled = true) {
    const { chainId } = useChainContext(override);

    return useQuery({
        enabled,
        staleTime: STALE_TIMES.MINUTE_2,

        queryKey: ['native-token', 'price', chainId],
        queryFn: async () => {
            const nativeToken = getNativeToken(override?.networkType ?? NetworkType.Ethereum, chainId);
            return getFungibleTokenPrice(chainId, nativeToken.address);
        },
    });
}
