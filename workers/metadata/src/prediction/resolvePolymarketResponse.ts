import type { PolymarketResponse } from '@/metadata/src/prediction/types.js';

export function resolvePolymarketResponse<T extends object>(response: PolymarketResponse<T>) {
    if ('error' in response) {
        throw new Error(response.error);
    }
    return response;
}
