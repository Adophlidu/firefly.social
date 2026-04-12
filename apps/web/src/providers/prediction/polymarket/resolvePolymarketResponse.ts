import type { PolymarketResponse } from '@/providers/prediction/polymarket/type.js';

export function resolvePolymarketResponse<T extends object>(response: PolymarketResponse<T>) {
    if ('error' in response) {
        throw new Error(response.error);
    }
    return response;
}
