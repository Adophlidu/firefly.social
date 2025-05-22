import { useQuery } from '@tanstack/react-query';

import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useSingleCoin(coinId: string | undefined, chainId?: number, address?: string) {
    const enabled = !!coinId || !!(chainId && address);
    return useQuery({
        enabled,
        queryKey: ['coingecko', 'coin-price', coinId, chainId, address],
        queryFn: async () => {
            const result = await FireflyEndpointProvider.getSingleCoin({
                coingecko_id: coinId,
                chain_id: chainId,
                address,
            });
            return result;
        },
    });
}
