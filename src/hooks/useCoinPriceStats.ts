import { skipToken, useQuery } from '@tanstack/react-query';

import { EMPTY_LIST } from '@/constants/index.js';
import { useIsPriceUp } from '@/hooks/useIsPriceUp.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useCoinPriceStats(
    coinId: string | undefined,
    chainId: number | undefined,
    address: string | undefined,
    days: number | undefined,
) {
    return useQuery({
        queryKey: ['coingecko', 'token-price-stats', coinId, chainId, address, days],
        queryFn:
            coinId || (chainId && address)
                ? async () => {
                      return FireflyEndpointProvider.getTokenPriceStats({
                          coingecko_coin_id: coinId,
                          chain_id: chainId,
                          address,
                          days,
                      });
                  }
                : skipToken,
        select(data) {
            return data.prices.map(([date, price]) => ({ date, value: price }));
        },
    });
}

export function useCoinPrice24hStats(
    coinId: string | undefined,
    chainId: number | undefined,
    address: string | undefined,
    days: number = 1,
) {
    const { data: priceStats = EMPTY_LIST, isPending } = useCoinPriceStats(coinId, chainId, address, days);
    const { isUp } = useIsPriceUp(priceStats);

    return {
        priceStats,
        isPending,
        isUp,
    };
}
