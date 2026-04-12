import urlcat from 'urlcat';
import type { Address } from 'viem';

import { APP_BASE_PATH, POLYMARKET_DATA_API_ROOT_URL } from '@/constants/static.js';
import { Fetch } from '@/lib/Fetch.js';

export interface PolymarketUserValueResponse {
    user: string;
    value: number;
}

export class PolymarketDataEndpoint extends Fetch {
    async getUserValue(user: Address) {
        const url = urlcat('/value', { user });
        return this.get<PolymarketUserValueResponse[]>(url);
    }
}

export const polymarketDataEndpoint = new PolymarketDataEndpoint({
    // Browser: use same-origin proxy to avoid CORS.
    // Server: call data-api directly.
    baseURL: typeof window === 'undefined' ? POLYMARKET_DATA_API_ROOT_URL : `${APP_BASE_PATH}/api/polymarket-data`,
});
