import { useQuery } from '@tanstack/react-query';

import { CoinGecko } from '@/providers/coingecko/index.js';

export function useCoinInfo(coinId: string) {
    return useQuery({
        queryKey: ['coin-info', coinId],
        queryFn() {
            return CoinGecko.getCoinInfo(coinId);
        },
    });
}
