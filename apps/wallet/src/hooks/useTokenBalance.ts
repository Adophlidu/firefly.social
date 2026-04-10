import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { addressesMatch } from '@/helpers/swap/formatSwapAmount.js';
import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { createSwapEndpoint } from '@/providers/swap/swapEndpoint.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';

interface Options {
    walletAddress?: string | null;
    address?: string;
    chainId?: number;
    refetchInterval?: number;
}

export function useTokenBalance({ address, chainId, walletAddress, refetchInterval }: Options) {
    const { isPrivyReady } = useSwapContextWalletAddresses();
    const authToken = useAtomValue(fireflySessionTokenAtom);

    return useQuery({
        queryKey: ['token-balance', walletAddress, chainId, address, authToken],
        queryFn: async () => {
            if (!address || !chainId || !authToken || !walletAddress) return null;

            const result = await createSwapEndpoint(authToken).getUserTokenBalancesMultiChain(
                [walletAddress],
                [chainId],
            );
            const tokens = result.get(walletAddress.toLowerCase());
            const token = tokens?.find((t) => t.chainId === chainId && addressesMatch(t.address, address));
            return token || null;
        },
        enabled: !!address && !!chainId && isPrivyReady && !!authToken && !!walletAddress,
        staleTime: 60 * 1000, // 1 minute
        refetchInterval,
    });
}
