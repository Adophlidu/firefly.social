import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';

import { useTipsTokens } from '@/hooks/useTipsTokens.js';
import { SolanaChainId } from '@/mask_pkgs/web3-shared/solana/index.js';
import { getSolanaTokenList } from '@/providers/solana/getTokenList.js';

export function useMixesTokens({ evmAddress, solanaAddress }: { evmAddress?: Address; solanaAddress?: string }) {
    const { tokens: evmTokens = [], isLoading: isLoadingEvmTokens } = useTipsTokens(evmAddress);
    const { data: solanaTokens = [], isLoading: isLoadingSolanaTokens } = useQuery({
        queryKey: ['solana-tokens', solanaAddress],
        staleTime: 1000 * 60 * 2, // 2 minutes
        queryFn: () => {
            if (!solanaAddress) return [];
            return getSolanaTokenList(SolanaChainId.Mainnet, solanaAddress);
        },
        enabled: !!solanaAddress,
    });
    const isLoading = isLoadingEvmTokens && isLoadingSolanaTokens;
    return {
        isLoading,
        tokens: [...evmTokens, ...solanaTokens],
    };
}
