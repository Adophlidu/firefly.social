import { skipToken, useQuery } from '@tanstack/react-query';

import { getCoinTrending } from '@/providers/coingecko/getCoinTrending.js';

export function useCoinTrending(coinId: string | null | undefined) {
    return useQuery({
        queryKey: ['coingecko', 'trending', coinId],
        queryFn: coinId ? () => getCoinTrending(coinId) : skipToken,
    });
}
