import { useQuery } from '@tanstack/react-query';

import { fireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export function useSingleCoin(coinId: string | null | undefined, chainId?: number, address?: string) {
    const enabled = !!coinId || !!(chainId && address);
    return useQuery({
        enabled,
        queryKey: ['single-coin', coinId, chainId, address],
        queryFn: async () => {
            const result = await fireflyEndpointProvider.getSingleCoin({
                coingecko_id: coinId,
                chain_id: chainId,
                address,
            });
            return result;
        },
    });
}
