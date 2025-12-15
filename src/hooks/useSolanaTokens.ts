import { useQuery } from '@tanstack/react-query';

import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { getMultiChainTokenList } from '@/providers/firefly/endpoint/getMultiChainTokenList.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function useSolanaTokens(address?: string) {
    return useQuery({
        queryKey: ['solana-tokens', address?.toLowerCase()],
        staleTime: 1000 * 60 * 2, // 2 minutes
        async queryFn() {
            if (!address) return [];
            const tokens = await getMultiChainTokenList([address], [SolanaChainId.Mainnet]);
            return tokens.map((x) => formatTokenFromFireflyTokenAsset(x));
        },
        enabled: !!address,
    });
}
