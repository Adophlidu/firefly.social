import { describe, expect, it } from 'vitest';

import {
    groupLiveSportsEventsByLeague,
    groupLiveSportsListForDisplay,
    groupSportsEventsForDisplay,
    liveSportsListHasDisplayContent,
} from '@/helpers/prediction/category/groupSportsEventsForDisplay.js';
import type { PolymarketSportsEvent, PolymarketSportsListResponse } from '@/providers/types/Firefly.js';

function event(id: string, leagueName?: string, sportId?: string): PolymarketSportsEvent {
    return {
        id,
        slug: id,
        leagueName,
        sportId,
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

describe('groupLiveSportsListForDisplay', () => {
    it('builds Live and Starting Soon sections without sport subgroups', () => {
        const response = {
            live: [event('live-1', undefined, 'basketball'), event('live-2', undefined, 'soccer')],
            today: [event('soon-1', undefined, 'basketball')],
            tomorrow: [event('tomorrow-1', undefined, 'soccer')],
            afterTomorrow: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const result = groupLiveSportsListForDisplay(response);

        expect(result.sections.map((section) => section.id)).toEqual(['live', 'starting-soon']);
        expect(result.sections[0]?.title).toBe('Live');
        expect(result.sections[0]?.events.map((item) => item.id)).toEqual(['live-1', 'live-2']);
        expect(result.sections[1]?.title).toBe('Starting Soon');
        expect(result.sections[1]?.events.map((item) => item.id)).toEqual(['soon-1']);
    });

    it('omits empty time blocks and ignores tomorrow data', () => {
        const response = {
            live: [],
            today: [],
            tomorrow: [event('tomorrow-1', undefined, 'soccer')],
            afterTomorrow: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        expect(groupLiveSportsListForDisplay(response).sections).toEqual([]);
        expect(liveSportsListHasDisplayContent(response)).toBe(false);
    });

    it('preserves event order within a section', () => {
        const response = {
            live: [event('live-a', undefined, 'basketball'), event('live-b', undefined, 'basketball')],
            today: [],
            tomorrow: [],
            afterTomorrow: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const liveSection = groupLiveSportsListForDisplay(response).sections[0];

        expect(liveSection?.events.map((item) => item.id)).toEqual(['live-a', 'live-b']);
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
