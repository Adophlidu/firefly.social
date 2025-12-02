import { useQuery } from '@tanstack/react-query';

import { getBalanceOf } from '@/helpers/getBalanceOf.js';

export function useBalanceOf(chainId: number, account: string, address?: string, enabled = true) {
    return useQuery({
        queryKey: ['balance-of', chainId, account, address],
        queryFn: () => getBalanceOf(chainId, account, address),
        enabled,
    });
}
