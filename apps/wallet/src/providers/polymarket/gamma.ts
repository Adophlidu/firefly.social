import { POLYMARKET_GAMMA_API_ROOT_URL } from '@dimensiondev/constants/static';
import { APP_BASE_PATH } from '@dimensiondev/envs/wallet';
import urlcat from 'urlcat';

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
        const url = urlcat('/markets/keyset', { condition_ids: conditionId });
        const result = await this.get<{ markets?: PolymarketGammaMarket[] }>(url);
        if (result.ok && result.data?.markets?.length) {
            return { ok: true as const, status: result.status, data: result.data.markets[0], raw: result.raw };
        }
        return {
            ok: false as const,
            status: result.status,
            data: undefined as unknown as PolymarketGammaMarket,
            raw: result.raw,
        };
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
