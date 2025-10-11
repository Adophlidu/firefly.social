import urlcat from 'urlcat';

import { fetchJson } from '@/helpers/fetchJson.js';
import { resolvePolymarketResponse } from '@/providers/polymarket/resolvePolymarketResponse.js';
import type { VolumeTradedResponse } from '@/providers/polymarket/type.js';

const labApiDomain = 'https://lb-api.polymarket.com';

export class PolymarketLabApi {
    static async getVolumeTraded(address: string) {
        const url = urlcat(labApiDomain, '/volume', {
            window: 'all',
            limit: 1,
            address,
        });
        const response = await fetchJson<VolumeTradedResponse>(url);
        return resolvePolymarketResponse(response);
    }
}
