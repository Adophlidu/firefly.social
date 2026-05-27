import { t } from '@lingui/core/macro';
import dayjs from 'dayjs';

import type {
    PolymarketEventSlugListData,
    PolymarketSportsEvent,
    PolymarketSportsListResponse,
    PolymarketSportsMarketData,
} from '@/providers/types/Firefly.js';

export interface SportsEventDisplaySection {
    id: string;
    title: string;
    events: PolymarketSportsEvent[];
}

export interface SportsGamesListDisplay {
    sections: SportsEventDisplaySection[];
    closedEvents: PolymarketSportsEvent[];
}

export interface LiveSportsTimeSection {
    id: string;
    title: string;
    sportSections: SportsEventDisplaySection[];
}

export interface LiveSportsListDisplay {
    timeSections: LiveSportsTimeSection[];
}

interface SportLabelMap {
    labelByKey: Map<string, string>;
    orderedKeys: string[];
}

function resolveSportItemKey(item: PolymarketEventSlugListData): string {
    return (item.slug_tag || item.slug).trim();
}

export function buildSportLabelMap(primaryItem: PolymarketEventSlugListData): SportLabelMap {
    const labelByKey = new Map<string, string>();
    const orderedKeys: string[] = [];

    for (const item of primaryItem.sub_slug ?? []) {
        if (item.type !== 'sport') continue;
        if (item.slug === 'live') continue;

        const key = resolveSportItemKey(item);
        if (!key || labelByKey.has(key)) continue;

        labelByKey.set(key, item.label?.trim() || key);
        orderedKeys.push(key);
    }

    return { labelByKey, orderedKeys };
}

function resolveEventSportKey(event: PolymarketSportsEvent, labelByKey: Map<string, string>): string {
    const sportId = event.sportId?.trim();
    if (sportId && labelByKey.has(sportId)) return sportId;

    if (sportId) return sportId;

    return '';
}

function resolveSportSectionTitle(sportKey: string, labelByKey: Map<string, string>): string {
    if (!sportKey) return t`Other`;

    const label = labelByKey.get(sportKey);
    if (label) return label;

    return sportKey.toUpperCase();
}

export function groupEventsBySport(
    events: PolymarketSportsEvent[],
    sportLabelMap: SportLabelMap,
): SportsEventDisplaySection[] {
    const { labelByKey, orderedKeys } = sportLabelMap;
    const grouped = new Map<string, PolymarketSportsEvent[]>();
    const unknownKeys: string[] = [];

    for (const event of events) {
        const sportKey = resolveEventSportKey(event, labelByKey);
        const bucketKey = sportKey || '__other__';
        const list = grouped.get(bucketKey) ?? [];
        list.push(event);
        grouped.set(bucketKey, list);

        if (sportKey && !orderedKeys.includes(sportKey) && !unknownKeys.includes(sportKey)) {
            unknownKeys.push(sportKey);
        }
    }

    const sections: SportsEventDisplaySection[] = [];

    const appendSection = (sportKey: string) => {
        const bucketKey = sportKey || '__other__';
        const sectionEvents = grouped.get(bucketKey);
        if (!sectionEvents?.length) return;

        const title = resolveSportSectionTitle(sportKey, labelByKey);
        sections.push({
            id: `sport-${bucketKey}`,
            title,
            events: sectionEvents,
        });
    };

    for (const key of orderedKeys) {
        appendSection(key);
    }

    for (const key of unknownKeys.sort((a, b) => a.localeCompare(b))) {
        appendSection(key);
    }

    appendSection('');

    return sections;
}

export function groupLiveSportsListForDisplay(
    response: PolymarketSportsListResponse,
    primaryItem: PolymarketEventSlugListData,
): LiveSportsListDisplay {
    const sportLabelMap = buildSportLabelMap(primaryItem);
    const timeSections: LiveSportsTimeSection[] = [];

    const liveSportSections = groupEventsBySport(response.live, sportLabelMap);
    if (liveSportSections.length > 0) {
        timeSections.push({
            id: 'live',
            title: t`Live`,
            sportSections: liveSportSections,
        });
    }

    const startingSoonSportSections = groupEventsBySport(response.today, sportLabelMap);
    if (startingSoonSportSections.length > 0) {
        timeSections.push({
            id: 'starting-soon',
            title: t`Starting Soon`,
            sportSections: startingSoonSportSections,
        });
    }

    return { timeSections };
}

export function liveSportsListHasDisplayContent(
    response: PolymarketSportsListResponse | undefined,
    primaryItem: PolymarketEventSlugListData,
): boolean {
    if (!response) return false;
    return groupLiveSportsListForDisplay(response, primaryItem).timeSections.length > 0;
}

function resolveLeagueSectionTitle(event: PolymarketSportsEvent): string {
    const leagueName = event.leagueName?.trim();
    if (leagueName) return leagueName;

    const leagueId = event.leagueId?.trim();
    if (leagueId) return leagueId.toUpperCase();

    return t`Other`;
}

export function groupLiveSportsEventsByLeague(events: PolymarketSportsEvent[]): SportsEventDisplaySection[] {
    const grouped = new Map<string, PolymarketSportsEvent[]>();

    for (const event of events) {
        const title = resolveLeagueSectionTitle(event);
        const list = grouped.get(title) ?? [];
        list.push(event);
        grouped.set(title, list);
    }

    return [...grouped.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([title, sectionEvents]) => ({
            id: `league-${title}`,
            title,
            events: sectionEvents,
        }));
}

export function groupSportsEventsForDisplay(response: PolymarketSportsListResponse): SportsGamesListDisplay {
    const sections: SportsEventDisplaySection[] = [];

    if (response.live.length > 0) {
        sections.push({
            id: 'live',
            title: t`Live`,
            events: response.live,
        });
    }

    if (response.today.length > 0) {
        sections.push({
            id: 'today',
            title: t`Today`,
            events: response.today,
        });
    }

    if (response.tomorrow.length > 0) {
        sections.push({
            id: 'tomorrow',
            title: t`Tomorrow`,
            events: response.tomorrow,
        });
    }

    if (response.afterTomorrow.length > 0) {
        const groupedByDate = new Map<string, PolymarketSportsEvent[]>();
        for (const event of response.afterTomorrow) {
            const firstMarket = event.markets?.[0] as PolymarketSportsMarketData | undefined;
            const startDate = firstMarket?.gameStartTime || event.startDate;
            const dateKey = dayjs(startDate).format('YYYY-MM-DD');
            const list = groupedByDate.get(dateKey) ?? [];
            list.push(event);
            groupedByDate.set(dateKey, list);
        }

        for (const [dateKey, events] of [...groupedByDate.entries()].sort(([a], [b]) => a.localeCompare(b))) {
            sections.push({
                id: `date-${dateKey}`,
                title: dayjs(dateKey).format('MMM D'),
                events,
            });
        }
    }

    return {
        sections,
        closedEvents: response.closed,
    };
}
