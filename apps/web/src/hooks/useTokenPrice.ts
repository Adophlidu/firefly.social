import { skipToken, useQuery } from '@tanstack/react-query';

import { getTokenPrice } from '@/providers/coingecko/getTokenPrice.js';

export function useTokenPrice(coinId: string | null | undefined) {
    return useQuery({
        queryKey: ['coingecko', 'coin-price', coinId],
        queryFn: coinId ? () => getTokenPrice(coinId) : skipToken,
    });
}
