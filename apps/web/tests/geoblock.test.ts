import { describe, expect, it } from 'vitest';

import { ALLOWED_EVERYTHING, isGeoBlocked } from '@/constants/geoblock.js';
import type { GeoblockResponse } from '@/providers/types/Firefly.js';

describe('geoblock fail-open (FW-7842)', () => {
    describe('fallback', () => {
        // When the /v1/geoblock request hasn't resolved or has errored, the client falls
        // back to ALLOWED_EVERYTHING. The user must be allowed through (fail-open).
        it.each(['bets', 'swap', 'perps'] as const)('allows %s when the API is unavailable', (type) => {
            expect(isGeoBlocked(ALLOWED_EVERYTHING, type)).toBe(false);
        });
    });

    describe('isGeoBlocked', () => {
        // Only the item matching the requested type matters; other types being blocked
        // must not produce false positives.
        it('returns true only for the matching blocked type', () => {
            const response: GeoblockResponse = {
                ip: '',
                country: '',
                city: '',
                region: '',
                items: [
                    { blocked: true, type: 'bets', block_country_list: [] },
                    { blocked: false, type: 'swap', block_country_list: [] },
                    { blocked: true, type: 'perps', block_country_list: [] },
                ],
            };

            expect(isGeoBlocked(response, 'bets')).toBe(true);
            expect(isGeoBlocked(response, 'swap')).toBe(false);
            expect(isGeoBlocked(response, 'perps')).toBe(true);
        });

        // Once the API returns a valid region, genuine blocks still apply.
        it('allows an unblocked region and blocks a blocked region', () => {
            const allowed: GeoblockResponse = {
                ip: '1.2.3.4',
                country: 'US',
                city: '',
                region: '',
                items: [
                    { blocked: false, type: 'bets', block_country_list: [] },
                    { blocked: false, type: 'swap', block_country_list: [] },
                    { blocked: false, type: 'perps', block_country_list: [] },
                ],
            };

            expect(isGeoBlocked(allowed, 'bets')).toBe(false);
            expect(isGeoBlocked(allowed, 'swap')).toBe(false);
            expect(isGeoBlocked(allowed, 'perps')).toBe(false);

            const blocked: GeoblockResponse = {
                ...allowed,
                country: 'CN',
                items: [
                    { blocked: false, type: 'bets', block_country_list: [] },
                    {
                        blocked: true,
                        type: 'swap',
                        block_country_list: [{ country_code: 'CN', country_name: 'China' }],
                    },
                    {
                        blocked: true,
                        type: 'perps',
                        block_country_list: [{ country_code: 'CN', country_name: 'China' }],
                    },
                ],
            };

            expect(isGeoBlocked(blocked, 'bets')).toBe(false);
            expect(isGeoBlocked(blocked, 'swap')).toBe(true);
            expect(isGeoBlocked(blocked, 'perps')).toBe(true);
        });
    });
});
