import { useQuery } from '@tanstack/react-query';

import { formatTokenFromFireflyTokenAsset } from '@/helpers/formatTokenFromFireflyTokenAsset.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useSolanaTokens(address?: string) {
    return useQuery({
        queryKey: ['solana-tokens', address],
        staleTime: 1000 * 60 * 2, // 2 minutes
        async queryFn() {
            if (!address) return [];
            const tokens = await FireflyEndpointProvider.getMultiChainTokenList([address], [SolanaChainId.Mainnet]);
            return tokens.map((x) => formatTokenFromFireflyTokenAsset(x));
        },
        enabled: !!address,
    });
}
