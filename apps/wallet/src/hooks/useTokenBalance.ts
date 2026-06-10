import { isNativeTokenOrSameAddress } from '@dimensiondev/web3/utils';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { useSwapContextWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';
import { getSwapEndpoint } from '@/store/swapEndpoint.js';

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

            const endpoint = getSwapEndpoint();
            const result = await endpoint.getUserTokenBalancesMultiChain([walletAddress], [chainId]);
            const tokens = result.get(walletAddress.toLowerCase());
            const token = tokens?.find((t) => t.chainId === chainId && isNativeTokenOrSameAddress(t.address, address));
            return token || null;
        },
        enabled: !!address && !!chainId && isPrivyReady && !!authToken && !!walletAddress,
        staleTime: 60 * 1000, // 1 minute
        refetchInterval,
    });
}
