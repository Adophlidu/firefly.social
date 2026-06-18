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

function displayableEvent(
    id: string,
    leagueName?: string,
    leagueId?: string,
    volume = 100,
    gameStartTime?: string,
): PolymarketSportsEvent {
    return {
        id,
        slug: id,
        leagueName,
        leagueId,
        volume,
        startDate: gameStartTime,
        markets: [
            {
                sportsMarketType: 'moneyline',
                outcomes: '["Home","Away"]',
                outcomePrices: '["0.4","0.6"]',
                clobTokenIds: '["token-home","token-away"]',
                gameStartTime,
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

    it('orders leagues by highest event volume when sortLeaguesByVolume is enabled', () => {
        const sections = groupLiveSportsEventsByLeague(
            [
                displayableEvent('low', 'EPL', undefined, 50),
                displayableEvent('high', 'NBA', undefined, 500),
                displayableEvent('mid', 'NHL', undefined, 200),
            ],
            { sortLeaguesByVolume: true },
        );

        expect(sections.map((section) => section.title)).toEqual(['NBA', 'NHL', 'EPL']);
    });

    it('orders leagues and events by start time when sortByStartTime is enabled', () => {
        const sections = groupLiveSportsEventsByLeague(
            [
                displayableEvent('late-league', 'EPL', undefined, 100, '2026-05-20T22:00:00Z'),
                displayableEvent('early-league', 'NBA', undefined, 100, '2026-05-20T18:00:00Z'),
                displayableEvent('later-in-nba', 'NBA', undefined, 100, '2026-05-20T20:00:00Z'),
                displayableEvent('earlier-in-nba', 'NBA', undefined, 100, '2026-05-20T19:00:00Z'),
            ],
            { sortByStartTime: true },
        );

        expect(sections.map((section) => section.title)).toEqual(['NBA', 'EPL']);
        expect(sections[0]?.events.map((item) => item.id)).toEqual(['early-league', 'earlier-in-nba', 'later-in-nba']);
        expect(sections[1]?.events.map((item) => item.id)).toEqual(['late-league']);
    });
});

describe('groupLiveSportsListForDisplay', () => {
    it('builds Sports Live and Coming Soon time blocks with league subgroups from event data', () => {
        const response = {
            live: [displayableEvent('live-1', 'NBA', undefined, 500), displayableEvent('live-2', 'EPL', undefined, 50)],
            today: [displayableEvent('soon-1', 'NBA')],
            tomorrow: [displayableEvent('tomorrow-1', 'EPL')],
            afterTomorrow: [],
            afterThreeDays: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const result = groupLiveSportsListForDisplay(response);

        expect(result.timeSections.map((section) => section.id)).toEqual(['live', 'starting-soon']);
        expect(result.timeSections[0]?.title).toBe('Sports Live');
        expect(result.timeSections[0]?.sportSections.map((section) => section.title)).toEqual(['NBA', 'EPL']);
        expect(result.timeSections[0]?.sportSections[0]?.events.map((item) => item.id)).toEqual(['live-1']);
        expect(result.timeSections[0]?.sportSections[1]?.events.map((item) => item.id)).toEqual(['live-2']);
        expect(result.timeSections[1]?.title).toBe('Coming Soon');
        expect(result.timeSections[1]?.sportSections.map((section) => section.title)).toEqual(['NBA']);
        expect(result.timeSections[1]?.sportSections[0]?.events.map((item) => item.id)).toEqual(['soon-1']);
    });

    it('titles the live block "Esports Live" when the esport option is set', () => {
        const response = {
            live: [displayableEvent('live-1', 'LOL')],
            today: [],
            tomorrow: [],
            afterTomorrow: [],
            afterThreeDays: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        expect(groupLiveSportsListForDisplay(response, { esport: true }).timeSections[0]?.title).toBe('Esports Live');
        expect(liveSportsListHasDisplayContent(response, { esport: true })).toBe(true);
    });

    it('omits empty time blocks and ignores tomorrow data', () => {
        const response = {
            live: [],
            today: [],
            tomorrow: [displayableEvent('tomorrow-1', 'EPL')],
            afterTomorrow: [],
            afterThreeDays: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        expect(groupLiveSportsListForDisplay(response).timeSections).toEqual([]);
        expect(liveSportsListHasDisplayContent(response)).toBe(false);
    });

    it('sorts Starting Soon leagues and events by start time', () => {
        const response = {
            live: [],
            today: [
                displayableEvent('soon-late-league', 'EPL', undefined, 100, '2026-05-20T22:00:00Z'),
                displayableEvent('soon-early-league', 'NBA', undefined, 100, '2026-05-20T18:00:00Z'),
                displayableEvent('soon-later', 'NBA', undefined, 100, '2026-05-20T20:00:00Z'),
                displayableEvent('soon-earlier', 'NBA', undefined, 100, '2026-05-20T19:00:00Z'),
            ],
            tomorrow: [],
            afterTomorrow: [],
            afterThreeDays: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const startingSoonSection = groupLiveSportsListForDisplay(response).timeSections[0];

        expect(startingSoonSection?.id).toBe('starting-soon');
        expect(startingSoonSection?.sportSections.map((section) => section.title)).toEqual(['NBA', 'EPL']);
        expect(startingSoonSection?.sportSections[0]?.events.map((item) => item.id)).toEqual([
            'soon-early-league',
            'soon-earlier',
            'soon-later',
        ]);
        expect(startingSoonSection?.sportSections[1]?.events.map((item) => item.id)).toEqual(['soon-late-league']);
    });

    it('preserves event order within a league section', () => {
        const response = {
            live: [displayableEvent('live-a', 'NBA'), displayableEvent('live-b', 'NBA')],
            today: [],
            tomorrow: [],
            afterTomorrow: [],
            afterThreeDays: [],
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
            afterThreeDays: [],
            closed: [closed],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const result = groupSportsEventsForDisplay(response);

        expect(result.closedEvents).toEqual([closed]);
        expect(result.sections.some((section) => section.events.includes(closed))).toBe(false);
        expect(result.sections.find((section) => section.id === 'today')?.events).toEqual([today]);
    });

    it('omits non-displayable events from section counts', () => {
        const displayable = displayableEvent('today-1');
        const invalidEvents = Array.from({ length: 6 }, (_, index) => ({
            id: `invalid-${index}`,
            slug: `invalid-${index}`,
            markets: [],
        })) as unknown as PolymarketSportsEvent[];

        const response = {
            live: [],
            today: [displayable, ...invalidEvents],
            tomorrow: [],
            afterTomorrow: [],
            afterThreeDays: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const todaySection = groupSportsEventsForDisplay(response).sections.find((section) => section.id === 'today');

        expect(todaySection?.events).toEqual([displayable]);
        expect(todaySection?.events.length).toBe(1);
    });

    it('supports responses that omit afterThreeDays', () => {
        const today = displayableEvent('today-1');
        const response: PolymarketSportsListResponse = {
            live: [],
            today: [today],
            tomorrow: [],
            afterTomorrow: [],
            closed: [],
            timezone: 'UTC',
        };

        const result = groupSportsEventsForDisplay(response);

        expect(result.sections.find((section) => section.id === 'today')?.events).toEqual([today]);
    });

    it('groups afterThreeDays events into dated sections', () => {
        const future = displayableEvent('future-1', undefined, undefined, 100, '2026-05-23T02:00:00Z');
        const response = {
            live: [],
            today: [],
            tomorrow: [],
            afterTomorrow: [],
            afterThreeDays: [future],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const result = groupSportsEventsForDisplay(response);

        expect(result.sections.find((section) => section.id === 'date-2026-05-23')?.events).toEqual([future]);
    });
});
