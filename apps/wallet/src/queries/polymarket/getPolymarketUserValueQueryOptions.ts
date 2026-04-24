import { isSameAddress } from '@dimensiondev/web3/utils';
import { queryOptions } from '@tanstack/react-query';
import type { Address } from 'viem';

import { logger } from '@/lib/Logger.js';
import { polymarketDataEndpoint } from '@/providers/polymarket/dataApi.js';

export function getPolymarketUserValueQueryOptions(user?: Address) {
    return queryOptions({
        queryKey: ['polymarket-user-value', user?.toLowerCase()],
        async queryFn() {
            try {
                if (!user) return [];

                const res = await polymarketDataEndpoint.getUserValue(user);
                if (!res.ok) throw new Error('Failed to fetch polymarket value');
                return res.data;
            } catch (error) {
                logger.error('Error fetching polymarket user value', { error, user });
                // Return 0 on error to avoid breaking the UI, as this is a non-critical value
                return [];
            }
        },
        select(list) {
            const row = (list ?? []).find((x) => isSameAddress(x?.user ?? '', user));
            return row?.value ?? 0;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        enabled: !!user,
    });
}
