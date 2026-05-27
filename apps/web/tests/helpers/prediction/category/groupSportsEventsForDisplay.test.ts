import { describe, expect, it } from 'vitest';

import {
    buildSportLabelMap,
    groupEventsBySport,
    groupLiveSportsEventsByLeague,
    groupLiveSportsListForDisplay,
    groupSportsEventsForDisplay,
    liveSportsListHasDisplayContent,
} from '@/helpers/prediction/category/groupSportsEventsForDisplay.js';
import type {
    PolymarketEventSlugListData,
    PolymarketSportsEvent,
    PolymarketSportsListResponse,
} from '@/providers/types/Firefly.js';

function slugItem(
    slug: string,
    type?: string,
    sub_slug: PolymarketEventSlugListData[] = [],
    slug_tag?: string,
    label?: string,
): PolymarketEventSlugListData {
    return { slug, label: label ?? slug, type, sub_slug, slug_tag };
}

function sportsPrimary(): PolymarketEventSlugListData {
    return slugItem('sports', 'sport', [
        slugItem('live', 'live', [], 'live'),
        slugItem('basketball', 'sport', [], 'basketball', 'Basketball'),
        slugItem('soccer', 'sport', [], 'soccer', 'Soccer'),
    ]);
}

function event(id: string, leagueName?: string, sportId?: string): PolymarketSportsEvent {
    return {
        id,
        slug: id,
        leagueName,
        sportId,
    } as PolymarketSportsEvent;
}

describe('buildSportLabelMap', () => {
    it('excludes live and keeps sport chip order', () => {
        const map = buildSportLabelMap(sportsPrimary());

        expect(map.orderedKeys).toEqual(['basketball', 'soccer']);
        expect(map.labelByKey.get('basketball')).toBe('Basketball');
        expect(map.labelByKey.get('soccer')).toBe('Soccer');
        expect(map.labelByKey.has('live')).toBe(false);
    });
});

describe('groupEventsBySport', () => {
    it('groups events by sportId in nav order and hides empty sports', () => {
        const sportLabelMap = buildSportLabelMap(sportsPrimary());
        const sections = groupEventsBySport(
            [event('1', undefined, 'basketball'), event('2', undefined, 'soccer'), event('3', undefined, 'basketball')],
            sportLabelMap,
        );

        expect(sections.map((section) => section.title)).toEqual(['Basketball', 'Soccer']);
        expect(sections[0]?.events.map((item) => item.id)).toEqual(['1', '3']);
        expect(sections[1]?.events.map((item) => item.id)).toEqual(['2']);
    });

    it('puts unknown sport keys after known keys', () => {
        const sportLabelMap = buildSportLabelMap(sportsPrimary());
        const sections = groupEventsBySport([event('1', undefined, 'hockey')], sportLabelMap);

        expect(sections).toHaveLength(1);
        expect(sections[0]?.title).toBe('HOCKEY');
    });

    it('groups events without sportId under Other', () => {
        const sportLabelMap = buildSportLabelMap(sportsPrimary());
        const sections = groupEventsBySport([event('1')], sportLabelMap);

        expect(sections).toHaveLength(1);
        expect(sections[0]?.title).toBe('Other');
    });
});

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
    it('builds Live and Starting Soon time blocks with sport subgroups', () => {
        const response = {
            live: [event('live-1', undefined, 'basketball'), event('live-2', undefined, 'soccer')],
            today: [event('soon-1', undefined, 'basketball')],
            tomorrow: [event('tomorrow-1', undefined, 'soccer')],
            afterTomorrow: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const result = groupLiveSportsListForDisplay(response, sportsPrimary());

        expect(result.timeSections.map((section) => section.id)).toEqual(['live', 'starting-soon']);
        expect(result.timeSections[0]?.title).toBe('Live');
        expect(result.timeSections[0]?.sportSections.map((section) => section.title)).toEqual(['Basketball', 'Soccer']);
        expect(result.timeSections[0]?.sportSections[0]?.events.map((item) => item.id)).toEqual(['live-1']);
        expect(result.timeSections[0]?.sportSections[1]?.events.map((item) => item.id)).toEqual(['live-2']);
        expect(result.timeSections[1]?.title).toBe('Starting Soon');
        expect(result.timeSections[1]?.sportSections.map((section) => section.title)).toEqual(['Basketball']);
        expect(result.timeSections[1]?.sportSections[0]?.events.map((item) => item.id)).toEqual(['soon-1']);
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

        expect(groupLiveSportsListForDisplay(response, sportsPrimary()).timeSections).toEqual([]);
        expect(liveSportsListHasDisplayContent(response, sportsPrimary())).toBe(false);
    });

    it('preserves event order within a sport section', () => {
        const response = {
            live: [event('live-a', undefined, 'basketball'), event('live-b', undefined, 'basketball')],
            today: [],
            tomorrow: [],
            afterTomorrow: [],
            closed: [],
            timezone: 'UTC',
        } as PolymarketSportsListResponse;

        const liveSportSection = groupLiveSportsListForDisplay(response, sportsPrimary()).timeSections[0]
            ?.sportSections[0];

        expect(liveSportSection?.events.map((item) => item.id)).toEqual(['live-a', 'live-b']);
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
