import { describe, expect, it } from 'vitest';

import {
    groupLiveSportsEventsByLeague,
    groupSportsEventsForDisplay,
} from '@/helpers/prediction/category/groupSportsEventsForDisplay.js';
import type { PolymarketSportsEvent, PolymarketSportsListResponse } from '@/providers/types/Firefly.js';

function event(id: string, leagueName?: string): PolymarketSportsEvent {
    return {
        id,
        slug: id,
        leagueName,
    } as PolymarketSportsEvent;
}

describe('groupLiveSportsEventsByLeague', () => {
    it('groups live events by leagueName without a Live section wrapper', () => {
        const sections = groupLiveSportsEventsByLeague([event('1', 'SUD'), event('2', 'EPL'), event('3', 'SUD')]);

        expect(sections).toHaveLength(2);
        expect(sections[0]?.title).toBe('EPL');
        expect(sections[0]?.events.map((item) => item.id)).toEqual(['2']);
        expect(sections[1]?.title).toBe('SUD');
        expect(sections[1]?.events.map((item) => item.id)).toEqual(['1', '3']);
    });

    it('falls back to leagueId when leagueName is missing', () => {
        const sections = groupLiveSportsEventsByLeague([
            { id: '1', slug: '1', leagueId: 'nba' } as PolymarketSportsEvent,
        ]);

        expect(sections[0]?.title).toBe('NBA');
    });
});

describe('groupSportsEventsForDisplay', () => {
    it('returns closed events separately from dated sections', () => {
        const closed = event('closed-1');
        const today = event('today-1');
        const response = {
            live: [],
            today: [today],
            tomorrow: [],
            afterTomorrow: [],
            closed: [closed],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const result = groupSportsEventsForDisplay(response);

        expect(result.closedEvents).toEqual([closed]);
        expect(result.sections.some((section) => section.events.includes(closed))).toBe(false);
        expect(result.sections.find((section) => section.id === 'today')?.events).toEqual([today]);
    });
});
