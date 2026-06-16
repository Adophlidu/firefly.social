import { skipToken, useQuery } from '@tanstack/react-query';

import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function usePolymarketBalance(proxyAddress?: string, refetchInterval?: number, isV2?: boolean) {
    const { data, isLoading: isLoadingBalance } = useQuery({
        queryKey: ['polymarket-balance', proxyAddress?.toLocaleLowerCase()],
        enabled: !!proxyAddress,
        staleTime: 1000 * 60, // 1 minute
        refetchInterval,
        refetchOnMount: 'always',
        retry: false,
        queryFn: !proxyAddress ? skipToken : () => getFireflyEndpoint().getPolymarketBalance(proxyAddress, true),
    });

    return {
        availableBalance: data?.cash_balance?.toString() || '0',
        totalBalance: data?.balance?.toString() || '0',
        isLoading: isLoadingBalance,
    };
}
