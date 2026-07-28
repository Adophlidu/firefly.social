import { describe, expect, it } from 'vitest';

import { formatPolymarketEvent } from '@/providers/firefly/prediction/formatEvents.js';
import type { PolymarketEvent, PolymarketMarket } from '@/providers/prediction/polymarket/type.js';

/** Minimal active binary (Yes/No) sub-market; only `id`/`description` vary between siblings. */
function buildMarket(id: string, description: string): PolymarketMarket {
    return {
        id,
        question: `${id} question`,
        conditionId: `${id}-condition`,
        slug: `${id}-slug`,
        endDate: '2026-12-31T00:00:00Z',
        createdAt: '2026-01-01T00:00:00Z',
        liquidity: '0',
        image: '',
        icon: '',
        description,
        outcomes: '["Yes","No"]',
        outcomePrices: '["0.5","0.5"]',
        volume: '0',
        active: true,
        closed: false,
        new: false,
        negRisk: false,
        umaResolutionStatus: '',
        umaResolutionStatuses: '[]',
        groupItemTitle: '',
        groupItemThreshold: '',
        clobTokenIds: '["yes","no"]',
        oneDayPriceChange: '',
        oneWeekPriceChange: '',
        events: [],
        orderPriceMinTickSize: '0.01',
    };
}

/** Minimal parent event wrapper. */
function buildEvent(
    markets: PolymarketMarket[],
    description = 'This is a market on the outcome of the parent event.',
): PolymarketEvent {
    return {
        id: 'event-1',
        slug: 'event-slug',
        title: 'Parent event',
        // The parent event carries a generic one-liner; sub-markets carry the detailed rules.
        description,
        startDate: '2026-01-01T00:00:00Z',
        creationDate: '2026-01-01T00:00:00Z',
        endDate: '2026-12-31T00:00:00Z',
        image: '',
        icon: '',
        active: true,
        closed: false,
        archived: false,
        new: false,
        liquidity: '0',
        volume: '0',
        openInterest: '0',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        negRisk: false,
        sortBy: '',
        markets,
        series: [],
        tags: [],
    };
}

describe('formatPolymarketEvent — sub-market description plumbing (FW-7955)', () => {
    it('carries each sub-market description into the UI market, distinct from the event description', () => {
        const event = buildEvent([
            buildMarket('splashdown', 'Splashdown: the booster must land intact in the ocean.'),
            buildMarket('booster-explosion', 'Booster explosion: any in-flight anomaly counts.'),
        ]);

        const result = formatPolymarketEvent(event);

        // The event-level description stays the generic parent one-liner.
        expect(result.description).toBe(event.description);

        // Each formatted market surfaces its OWN detailed description, not the event's.
        const splashdown = result.markets.find((m) => m.id === 'splashdown');
        const boosterExplosion = result.markets.find((m) => m.id === 'booster-explosion');

        expect(splashdown?.description).toBe('Splashdown: the booster must land intact in the ocean.');
        expect(boosterExplosion?.description).toBe('Booster explosion: any in-flight anomaly counts.');
        // The two sub-market descriptions must not collapse onto the event description.
        expect(splashdown?.description).not.toBe(event.description);
        expect(boosterExplosion?.description).not.toBe(event.description);
    });

    it('retains a market description even when it equals the event description (no special-casing)', () => {
        const shared = 'Shared description text.';
        const event = buildEvent([buildMarket('only-market', shared)], shared);

        const result = formatPolymarketEvent(event);
        expect(result.markets[0]?.description).toBe(shared);
        expect(result.description).toBe(shared);
    });
});
