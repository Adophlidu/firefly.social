import { describe, expect, it } from 'vitest';

import {
    groupLiveSportsEventsByLeague,
    groupLiveSportsListForDisplay,
    groupSportsEventsForDisplay,
    liveSportsListHasDisplayContent,
} from '@/helpers/prediction/category/groupSportsEventsForDisplay.js';
import type {
    PolymarketSportsEvent,
    PolymarketSportsListResponse,
    PolymarketSportsMarketData,
} from '@/providers/types/Firefly.js';

function displayableEvent(id: string, leagueName?: string, leagueId?: string): PolymarketSportsEvent {
    return {
        id,
        slug: id,
        leagueName,
        leagueId,
        volume: 100,
        markets: [
            {
                sportsMarketType: 'moneyline',
                outcomes: '["Home","Away"]',
                outcomePrices: '["0.4","0.6"]',
                clobTokenIds: '["token-home","token-away"]',
            } as PolymarketSportsMarketData,
        ],
    } as PolymarketSportsEvent;
}

describe('groupLiveSportsEventsByLeague', () => {
    it('groups live events by leagueName without a Live section wrapper', () => {
        const sections = groupLiveSportsEventsByLeague([
            displayableEvent('1', 'SUD'),
            displayableEvent('2', 'EPL'),
            displayableEvent('3', 'SUD'),
        ]);

        expect(sections).toHaveLength(2);
        expect(sections[0]?.title).toBe('EPL');
        expect(sections[0]?.events.map((item) => item.id)).toEqual(['2']);
        expect(sections[1]?.title).toBe('SUD');
        expect(sections[1]?.events.map((item) => item.id)).toEqual(['1', '3']);
    });

    it('falls back to leagueId when leagueName is missing', () => {
        const sections = groupLiveSportsEventsByLeague([displayableEvent('1', undefined, 'nba')]);

        expect(sections[0]?.title).toBe('NBA');
    });

    it('omits leagues with no displayable events', () => {
        const sections = groupLiveSportsEventsByLeague([
            { id: '1', slug: '1', leagueName: 'EPL' } as PolymarketSportsEvent,
        ]);

        expect(sections).toEqual([]);
    });
});

describe('groupLiveSportsListForDisplay', () => {
    it('builds Live and Starting Soon time blocks with league subgroups from event data', () => {
        const response = {
            live: [displayableEvent('live-1', 'NBA'), displayableEvent('live-2', 'EPL')],
            today: [displayableEvent('soon-1', 'NBA')],
            tomorrow: [displayableEvent('tomorrow-1', 'EPL')],
            afterTomorrow: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const result = groupLiveSportsListForDisplay(response);

        expect(result.timeSections.map((section) => section.id)).toEqual(['live', 'starting-soon']);
        expect(result.timeSections[0]?.title).toBe('Live');
        expect(result.timeSections[0]?.sportSections.map((section) => section.title)).toEqual(['EPL', 'NBA']);
        expect(result.timeSections[0]?.sportSections[0]?.events.map((item) => item.id)).toEqual(['live-2']);
        expect(result.timeSections[0]?.sportSections[1]?.events.map((item) => item.id)).toEqual(['live-1']);
        expect(result.timeSections[1]?.title).toBe('Starting Soon');
        expect(result.timeSections[1]?.sportSections.map((section) => section.title)).toEqual(['NBA']);
        expect(result.timeSections[1]?.sportSections[0]?.events.map((item) => item.id)).toEqual(['soon-1']);
    });

    it('omits empty time blocks and ignores tomorrow data', () => {
        const response = {
            live: [],
            today: [],
            tomorrow: [displayableEvent('tomorrow-1', 'EPL')],
            afterTomorrow: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        expect(groupLiveSportsListForDisplay(response).timeSections).toEqual([]);
        expect(liveSportsListHasDisplayContent(response)).toBe(false);
    });

    it('preserves event order within a league section', () => {
        const response = {
            live: [displayableEvent('live-a', 'NBA'), displayableEvent('live-b', 'NBA')],
            today: [],
            tomorrow: [],
            afterTomorrow: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const liveLeagueSection = groupLiveSportsListForDisplay(response).timeSections[0]?.sportSections[0];

        expect(liveLeagueSection?.events.map((item) => item.id)).toEqual(['live-a', 'live-b']);
    });
});

describe('groupSportsEventsForDisplay', () => {
    it('returns closed events separately from dated sections', () => {
        const closed = displayableEvent('closed-1');
        const today = displayableEvent('today-1');
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
