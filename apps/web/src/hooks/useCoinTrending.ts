import { skipToken, useQuery } from '@tanstack/react-query';
import { useContext } from 'react';

import { TokenContext } from '@/components/Token/TokenContext.js';
import { getCoinTrending } from '@/providers/coingecko/getCoinTrending.js';

export function useCoinTrending(coinId: string | null | undefined) {
    const { initialTrending } = useContext(TokenContext);
    const initialData = coinId && initialTrending?.coin.id === coinId ? initialTrending : undefined;

    return useQuery({
        enabled: !!coinId,
        retry: 2,
        queryKey: ['coingecko', 'trending', coinId],
        queryFn: coinId ? () => getCoinTrending(coinId) : skipToken,
        initialData,
        initialDataUpdatedAt: initialData ? 0 : undefined,
    });
}
