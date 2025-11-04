import { useQuery } from '@tanstack/react-query';

import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function useSolanaTokens(address?: string) {
    return useQuery({
        queryKey: ['solana-tokens', address],
        staleTime: 1000 * 60 * 2, // 2 minutes
        async queryFn() {
            if (!address) return [];
            const tokens = await fireflyEndpointProvider.getMultiChainTokenList([address], [SolanaChainId.Mainnet]);
            return tokens.map((x) => formatTokenFromFireflyTokenAsset(x));
        },
        enabled: !!address,
    });
}
