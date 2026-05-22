import { describe, expect, it } from 'vitest';

import { resolveSportData } from '@/helpers/prediction/polymarket/resolveSportData.js';
import type { PolymarketEvent } from '@/providers/prediction/polymarket/type.js';

function baseEvent(overrides: Partial<PolymarketEvent> = {}): PolymarketEvent {
    return {
        id: 'event-1',
        slug: 'nba-cle-nyk-2026-05-21',
        title: 'Cavaliers vs. Knicks',
        gameId: 20023812,
        leagueName: 'NBA',
        tags: [
            { id: 'sports', label: 'Sports', slug: 'sports' },
            { id: 'nba', label: 'NBA', slug: 'nba' },
            { id: 'games', label: 'Games', slug: 'games' },
            { id: 'basketball', label: 'Basketball', slug: 'basketball' },
        ],
        markets: [
            {
                sportsMarketType: 'moneyline',
                outcomes: '["Cavaliers","Knicks"]',
                teams: [
                    { name: 'Cavaliers', abbreviation: 'CLE' },
                    { name: 'Knicks', abbreviation: 'NYK' },
                ],
            },
        ],
        ...overrides,
    } as PolymarketEvent;
}

describe('resolveSportData', () => {
    it('uses the event league tag instead of the generic sports tag', () => {
        expect(resolveSportData(baseEvent())?.leagueSlug).toBe('nba');
    });

    it('falls back to the first non-generic sport tag when the league name is unavailable', () => {
        expect(resolveSportData(baseEvent({ leagueName: undefined }))?.leagueSlug).toBe('nba');
    });
});
