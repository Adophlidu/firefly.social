import { plus } from '@dimensiondev/web3/numbers';
import { skipToken, useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';

import { pusdTokenFallback } from '@/hooks/bet/useTokenDetail.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function usePolymarketBalance(proxyAddress?: string, refetchInterval?: number) {
    const { data: balance, isLoading } = useQuery({
        queryKey: ['polymarket-balance', pusdTokenFallback.address.toLowerCase(), proxyAddress?.toLowerCase()],
        enabled: !!proxyAddress,
        staleTime: 1000 * 60, // 1 minute
        retry: false,
        refetchInterval,
        queryFn: !proxyAddress
            ? skipToken
            : () =>
                  getFireflyEndpoint().getTokenByAddress(
                      proxyAddress,
                      pusdTokenFallback.chainId,
                      pusdTokenFallback.address,
                  ),
        select: (data) => data?.balance || '0',
    });
    const { data: value, isLoading: isLoadingValue } = useQuery({
        ...getPolymarketUserValueQueryOptions(proxyAddress as Address | undefined),
        staleTime: 1000 * 60, // 1 minute
        retry: false,
        refetchInterval,
    });

    return {
        availableBalance: balance || '0',
        totalBalance: plus(balance || '0', value || '0').toString(),
        isLoading: isLoading || isLoadingValue,
    };
}
