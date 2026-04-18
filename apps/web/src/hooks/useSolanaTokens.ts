import { solana } from '@dimensiondev/web3/chains';
import { useQuery } from '@tanstack/react-query';

import { STALE_TIMES } from '@/constants/query.js';
import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { getMultiChainTokenList } from '@/providers/firefly/endpoint/getMultiChainTokenList.js';

export function useSolanaTokens(address?: string) {
    return useQuery({
        queryKey: ['solana-tokens', address?.toLowerCase()],
        staleTime: STALE_TIMES.MINUTE_2,

        async queryFn() {
            if (!address) return [];
            const tokens = await getMultiChainTokenList([address], [solana.id]);
            return tokens.map((x) => formatTokenFromFireflyTokenAsset(x));
        },
        enabled: !!address,
    });
}
