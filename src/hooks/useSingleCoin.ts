import { useQuery } from '@tanstack/react-query';

import { getSingleCoin } from '@/providers/firefly/endpoint/getSingleCoin.js';

export function useSingleCoin(coinId: string | null | undefined, chainId?: number, address?: string) {
    const enabled = !!coinId || !!(chainId && address);
    return useQuery({
        enabled,
        queryKey: ['single-coin', coinId, chainId, address],
        queryFn: async () => {
            const result = await getSingleCoin({
                coingecko_id: coinId,
                chain_id: chainId,
                address,
            });
            return result;
        },
    });
}
