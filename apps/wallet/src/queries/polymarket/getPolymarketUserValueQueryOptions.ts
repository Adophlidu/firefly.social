import { queryOptions } from '@tanstack/react-query';
import type { Address } from 'viem';

import { isSameAddress } from '@/helpers/isSameAddress.js';
import { polymarketDataEndpoint } from '@/providers/polymarket/dataApi.js';

export function getPolymarketUserValueQueryOptions(user: Address) {
    return queryOptions({
        queryKey: ['polymarket-user-value', user.toLowerCase()],
        async queryFn() {
            const res = await polymarketDataEndpoint.getUserValue(user);
            if (!res.ok) throw new Error('Failed to fetch polymarket value');
            return res.data;
        },
        select(list) {
            const row = (list ?? []).find((x) => isSameAddress(String(x?.user ?? ''), user));
            return row?.value ?? 0;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
