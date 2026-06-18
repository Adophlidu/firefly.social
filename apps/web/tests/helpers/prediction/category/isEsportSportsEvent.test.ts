import { describe, expect, it } from 'vitest';

import { excludeEsportEvents, isEsportSportsEvent } from '@/helpers/prediction/category/isEsportSportsEvent.js';
import type {
    PolymarketSportsEvent,
    PolymarketSportsListResponse,
    PolymarketTagData,
} from '@/providers/types/Firefly.js';

function event(id: string, tagSlugs: string[] = []): PolymarketSportsEvent {
    return {
        id,
        slug: id,
        tags: tagSlugs.map((slug) => ({ slug }) as PolymarketTagData),
    } as PolymarketSportsEvent;
}

describe('isEsportSportsEvent', () => {
    it('is true when an event carries the esports tag', () => {
        expect(isEsportSportsEvent(event('1', ['sports', 'esports']))).toBe(true);
    });

    it('is false for regular sports events without the esports tag', () => {
        expect(isEsportSportsEvent(event('1', ['sports', 'basketball']))).toBe(false);
        expect(isEsportSportsEvent(event('1', []))).toBe(false);
    });

    it('is false when tags are missing', () => {
        expect(isEsportSportsEvent({ id: '1', slug: '1' } as PolymarketSportsEvent)).toBe(false);
    });
});

describe('excludeEsportEvents', () => {
    it('removes esports events from every bucket and keeps the rest', () => {
        const response: PolymarketSportsListResponse = {
            timezone: 'UTC',
            live: [event('lol-live', ['esports']), event('nba-live', ['basketball'])],
            today: [event('cs2', ['esports']), event('soccer', ['soccer'])],
            tomorrow: [event('val', ['esports'])],
            afterTomorrow: [event('dota2', ['esports']), event('tennis', ['tennis'])],
            afterThreeDays: [event('lol-later', ['esports'])],
            closed: [event('lol-closed', ['esports']), event('mma', ['mma'])],
        };

        const filtered = excludeEsportEvents(response);

        expect(filtered.live.map((e) => e.id)).toEqual(['nba-live']);
        expect(filtered.today.map((e) => e.id)).toEqual(['soccer']);
        expect(filtered.tomorrow).toEqual([]);
        expect(filtered.afterTomorrow.map((e) => e.id)).toEqual(['tennis']);
        expect(filtered.afterThreeDays).toEqual([]);
        expect(filtered.closed.map((e) => e.id)).toEqual(['mma']);
    });

    it('returns a new response and does not mutate the input', () => {
        const response: PolymarketSportsListResponse = {
            timezone: 'UTC',
            live: [event('lol', ['esports'])],
            today: [],
            tomorrow: [],
            afterTomorrow: [],
            closed: [],
        };

        const filtered = excludeEsportEvents(response);
        expect(filtered).not.toBe(response);
        expect(response.live).toHaveLength(1);
        expect(filtered.live).toEqual([]);
    });
});
