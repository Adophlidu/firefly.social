import urlcat from 'urlcat';

import { APP_BASE_PATH, POLYMARKET_GAMMA_API_ROOT_URL } from '@/constants/static.js';
import { Fetch } from '@/lib/Fetch.js';
import type { PolymarketGammaEvent, PolymarketGammaMarket } from '@/providers/polymarket/types.js';

export class PolymarketGammaEndpoint extends Fetch {
    async getMarketBySlug(slug: string, options?: { includeTag?: boolean }) {
        const url = urlcat('/markets/slug/:slug', {
            slug,
            include_tag: options?.includeTag,
        });
        return this.get<PolymarketGammaMarket>(url);
    }

    async getMarketByConditionId(conditionId: string) {
        const url = urlcat('/markets/:conditionId', { conditionId });
        return this.get<PolymarketGammaMarket>(url);
    }

    async getEventBySlug(slug: string, options?: { includeChat?: boolean; includeTemplate?: boolean }) {
        const url = urlcat('/events/slug/:slug', {
            slug,
            include_chat: options?.includeChat,
            include_template: options?.includeTemplate,
        });
        return this.get<PolymarketGammaEvent>(url);
    }
}

export const polymarketGammaEndpoint = new PolymarketGammaEndpoint({
    // Browser: use same-origin proxy to avoid CORS.
    // Server: call Gamma directly.
    baseURL: typeof window === 'undefined' ? POLYMARKET_GAMMA_API_ROOT_URL : `${APP_BASE_PATH}/api/polymarket`,
});
