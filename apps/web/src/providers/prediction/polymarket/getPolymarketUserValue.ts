import { POLYMARKET_DATA_API_ROOT_URL } from '@dimensiondev/constants/static';
import { isSameAddress } from '@dimensiondev/web3/utils';
import urlcat from 'urlcat';
import type { Address } from 'viem';

import { fetchJson } from '@/helpers/fetchJson.js';
import { logger } from '@/libs/Logger.js';

interface PolymarketUserValueResponse {
    user: string;
    value: number;
}

export async function getPolymarketUserValue(user: Address) {
    const baseURL = typeof window === 'undefined' ? POLYMARKET_DATA_API_ROOT_URL : '/api/polymarket-data';
    const url = urlcat(baseURL, '/value', { user });

    try {
        const list = await fetchJson<PolymarketUserValueResponse[]>(url);
        const row = list.find((x) => isSameAddress(x?.user ?? '', user));
        return row?.value ?? 0;
    } catch (error) {
        logger.error('Error fetching polymarket user value', { error, user });
        return 0;
    }
}
