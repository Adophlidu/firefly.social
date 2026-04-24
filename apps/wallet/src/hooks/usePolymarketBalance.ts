import { plus } from '@dimensiondev/web3/numbers';
import { skipToken, useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { polygon } from 'viem/chains';

import { P_USDC_POLYGON_ADDRESS, USDC_E_POLYGON_ADDRESS } from '@/constants/ethereum.js';
import { getPolymarketUserValueQueryOptions } from '@/queries/polymarket/getPolymarketUserValueQueryOptions.js';
import { getFireflyEndpoint } from '@/store/fireflyEndpoint.js';

export function usePolymarketBalance(proxyAddress?: string, refetchInterval?: number, isV2?: boolean) {
    const tokenAddress = isV2 ? P_USDC_POLYGON_ADDRESS : USDC_E_POLYGON_ADDRESS;
    const { data: balance, isLoading } = useQuery({
        queryKey: ['polymarket-balance', tokenAddress.toLocaleLowerCase(), proxyAddress?.toLowerCase()],
        enabled: !!proxyAddress,
        staleTime: 1000 * 60, // 1 minute
        retry: false,
        refetchInterval,
        queryFn: !proxyAddress
            ? skipToken
            : () => getFireflyEndpoint().getTokenByAddress(proxyAddress, polygon.id, tokenAddress),
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
