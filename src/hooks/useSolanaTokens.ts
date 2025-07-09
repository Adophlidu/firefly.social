import { useQuery } from '@tanstack/react-query';

import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';
import { getSolanaTokenList } from '@/providers/solana/getTokenList.js';

export function useSolanaTokens(address?: string) {
    return useQuery({
        queryKey: ['solana-tokens', address],
        staleTime: 1000 * 60 * 2, // 2 minutes
        queryFn: () => {
            if (!address) return [];
            return getSolanaTokenList(SolanaChainId.Mainnet, address);
        },
        enabled: !!address,
    });
}
