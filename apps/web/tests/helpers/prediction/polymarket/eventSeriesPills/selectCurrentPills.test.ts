import { describe, expect, it } from 'vitest';

import { constructPastMarketSlug } from '@/helpers/prediction/polymarket/eventSeriesPills/constructPastMarketSlug.js';
import { selectCurrentPills } from '@/helpers/prediction/polymarket/eventSeriesPills/selectCurrentPills.js';
import { selectLiveSlugSet } from '@/helpers/prediction/polymarket/eventSeriesPills/selectLiveSlugs.js';
import { selectMoreEvents } from '@/helpers/prediction/polymarket/eventSeriesPills/selectMoreEvents.js';
import type { SeriesEventForPills } from '@/helpers/prediction/polymarket/eventSeriesPills/types.js';

function event(slug: string, endDate: string, closed = false): SeriesEventForPills {
    return { slug, endDate, closed };
}

describe('constructPastMarketSlug', () => {
    it('builds hourly slug in ET', () => {
        const slug = constructPastMarketSlug(
            'bitcoin-up-or-down-january-1-3pm-et',
            '2025-01-15T20:00:00.000Z',
            '2025-01-15T21:00:00.000Z',
            'hourly',
        );
        expect(slug).toMatch(/^bitcoin-up-or-down-[a-z]+-\d+-\d+(am|pm)-et$/);
    });

    it('builds 5m slug from unix seconds', () => {
        const slug = constructPastMarketSlug(
            'btc-updown-5m-100',
            '2025-01-15T12:00:00.000Z',
            '2025-01-15T12:05:00.000Z',
            'fiveminute',
        );
        expect(slug).toBe(`btc-updown-5m-${Math.floor(new Date('2025-01-15T12:00:00.000Z').getTime() / 1000)}`);
    });
});

describe('selectCurrentPills', () => {
    it('returns first four open events when not hourly filtering', () => {
        const open = Array.from({ length: 6 }, (_, i) =>
            event(`election-winner-2028-candidate-${i}`, `2028-11-0${i + 1}T00:00:00.000Z`),
        );
        const result = selectCurrentPills(
            open,
            'election-winner-2028-candidate-0',
            false,
            Date.parse('2028-10-01T00:00:00.000Z'),
        );
        expect(result).toHaveLength(4);
        expect(result?.[0]?.slug).toBe('election-winner-2028-candidate-0');
    });

    it('injects current slug when missing from hourly window and not closed', () => {
        const serverNow = Date.parse('2025-06-15T22:00:00.000Z');
        const open = [
            event('bitcoin-up-or-down-june-15-3pm-et', '2025-06-15T19:00:00.000Z'),
            event('bitcoin-up-or-down-june-15-8pm-et', '2025-06-16T00:00:00.000Z'),
        ];
        const result = selectCurrentPills(open, 'bitcoin-up-or-down-june-15-3pm-et', false, serverNow);
        expect(result?.some((e) => e.slug === 'bitcoin-up-or-down-june-15-3pm-et')).toBe(true);
    });
});

describe('selectMoreEvents', () => {
    it('returns overflow events after the first four when not hourly filtering', () => {
        const open = Array.from({ length: 6 }, (_, i) => event(`series-event-${i}`, `2028-11-0${i + 1}T00:00:00.000Z`));
        const currents = open.slice(0, 4);
        const more = selectMoreEvents(open, 'series-event-0', currents, Date.parse('2028-10-01T00:00:00.000Z'));
        expect(more?.map((e) => e.slug)).toEqual(['series-event-4', 'series-event-5']);
    });
});

describe('selectLiveSlugSet', () => {
    it('picks first open event with endDate after serverNow', () => {
        const now = Date.parse('2025-06-15T18:00:00.000Z');
        const open = [
            event('a', '2025-06-15T17:00:00.000Z'),
            event('b', '2025-06-15T20:00:00.000Z'),
            event('c', '2025-06-15T22:00:00.000Z'),
        ];
        const live = selectLiveSlugSet(open, now);
        expect(live.has('b')).toBe(true);
        expect(live.size).toBe(1);
    });
});
