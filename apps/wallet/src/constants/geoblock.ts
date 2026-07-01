import type { GeoblockResponse } from '@/providers/types/Firefly.js';

/** Fallback used when the geoblock API hasn't responded yet or has errored. Defaults to all blocked (fail-closed). */
export const BLOCKED_EVERYTHING: GeoblockResponse = {
    ip: '',
    country: '',
    city: '',
    region: '',
    items: [
        { blocked: true, type: 'bets', block_country_list: [] },
        { blocked: true, type: 'swap', block_country_list: [] },
        { blocked: true, type: 'perps', block_country_list: [] },
    ],
};

export function isGeoBlocked(response: GeoblockResponse, type: 'bets' | 'swap' | 'perps'): boolean {
    return response.items.some((item) => item.type === type && item.blocked);
}
