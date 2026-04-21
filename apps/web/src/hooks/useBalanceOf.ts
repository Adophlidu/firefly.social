import { getBalanceOf } from '@dimensiondev/web3/actions';
import { useQuery } from '@tanstack/react-query';

import { wagmiConfig } from '@/configs/wagmiClient.js';

export function useBalanceOf(chainId: number, account: string, address?: string, enabled = true) {
    return useQuery({
        queryKey: ['balance-of', chainId, account?.toLowerCase(), address?.toLowerCase()],
        queryFn: () => getBalanceOf(wagmiConfig, chainId, account, address),
        enabled,
    });
}
