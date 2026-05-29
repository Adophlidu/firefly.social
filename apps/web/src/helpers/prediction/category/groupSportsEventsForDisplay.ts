import { t } from '@lingui/core/macro';
import dayjs from 'dayjs';

import { formatPolymarketSportsEventForUI } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import type {
    PolymarketSportsEvent,
    PolymarketSportsListResponse,
    PolymarketSportsMarketData,
} from '@/providers/types/Firefly.js';

function isDisplayableSportsEvent(event: PolymarketSportsEvent): boolean {
    return formatPolymarketSportsEventForUI(event) !== null;
}

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

function resolveLeagueSectionTitle(event: PolymarketSportsEvent): string {
    const leagueName = event.leagueName?.trim();
    if (leagueName) return leagueName;

    const leagueId = event.leagueId?.trim();
    if (leagueId) return leagueId.toUpperCase();

    return t`Other`;
}

function resolveSportsEventVolume(event: PolymarketSportsEvent): number {
    return event.volume || event.volume24hr || 0;
}

function resolveSportsEventStartTimeMs(event: PolymarketSportsEvent): number {
    for (const market of event.markets ?? []) {
        const sportsMarket = market as PolymarketSportsMarketData;
        if (sportsMarket.sportsMarketType === 'moneyline' && sportsMarket.gameStartTime) {
            const startMs = new Date(sportsMarket.gameStartTime).getTime();
            if (!Number.isNaN(startMs)) return startMs;
        }
    }

    const firstMarket = event.markets?.[0] as PolymarketSportsMarketData | undefined;
    const startDate = firstMarket?.gameStartTime || event.startDate;
    if (!startDate) return Number.POSITIVE_INFINITY;

    const startMs = new Date(startDate).getTime();
    return Number.isNaN(startMs) ? Number.POSITIVE_INFINITY : startMs;
}

function compareSportsEventsByStartTime(a: PolymarketSportsEvent, b: PolymarketSportsEvent): number {
    const startDiff = resolveSportsEventStartTimeMs(a) - resolveSportsEventStartTimeMs(b);
    return startDiff !== 0 ? startDiff : a.id.localeCompare(b.id);
}

function resolveLeagueSectionVolume(events: PolymarketSportsEvent[]): number {
    let maxVolume = 0;
    for (const event of events) {
        const volume = resolveSportsEventVolume(event);
        if (volume > maxVolume) maxVolume = volume;
    }
    return maxVolume;
}

function resolveLeagueSectionStartTimeMs(events: PolymarketSportsEvent[]): number {
    let earliestStart = Number.POSITIVE_INFINITY;
    for (const event of events) {
        const startMs = resolveSportsEventStartTimeMs(event);
        if (startMs < earliestStart) earliestStart = startMs;
    }
    return earliestStart;
}

interface GroupLiveSportsEventsByLeagueOptions {
    /** Live leagues are ordered by highest event volume. */
    sortLeaguesByVolume?: boolean;
    /** Starting Soon leagues and events are ordered by earliest start time. */
    sortByStartTime?: boolean;
}

export function groupLiveSportsListForDisplay(response: PolymarketSportsListResponse): LiveSportsListDisplay {
    const timeSections: LiveSportsTimeSection[] = [];

    const liveLeagueSections = groupLiveSportsEventsByLeague(response.live, { sortLeaguesByVolume: true });
    if (liveLeagueSections.length > 0) {
        timeSections.push({
            id: 'live',
            title: t`Live`,
            sportSections: liveLeagueSections,
        });
    }

    const startingSoonLeagueSections = groupLiveSportsEventsByLeague(response.today, { sortByStartTime: true });
    if (startingSoonLeagueSections.length > 0) {
        timeSections.push({
            id: 'starting-soon',
            title: t`Starting Soon`,
            sportSections: startingSoonLeagueSections,
        });
    }

    return { timeSections };
}

export function liveSportsListHasDisplayContent(response: PolymarketSportsListResponse | undefined): boolean {
    if (!response) return false;
    return groupLiveSportsListForDisplay(response).timeSections.length > 0;
}

export function groupLiveSportsEventsByLeague(
    events: PolymarketSportsEvent[],
    options?: GroupLiveSportsEventsByLeagueOptions,
): SportsEventDisplaySection[] {
    const grouped = new Map<string, PolymarketSportsEvent[]>();

    for (const event of events) {
        if (!isDisplayableSportsEvent(event)) continue;

        const title = resolveLeagueSectionTitle(event);
        const list = grouped.get(title) ?? [];
        list.push(event);
        grouped.set(title, list);
    }

    const entries = [...grouped.entries()];
    const sortedEntries = options?.sortLeaguesByVolume
        ? entries.sort(([titleA, eventsA], [titleB, eventsB]) => {
              const volumeDiff = resolveLeagueSectionVolume(eventsB) - resolveLeagueSectionVolume(eventsA);
              return volumeDiff !== 0 ? volumeDiff : titleA.localeCompare(titleB);
          })
        : options?.sortByStartTime
          ? entries.sort(([titleA, eventsA], [titleB, eventsB]) => {
                const startDiff = resolveLeagueSectionStartTimeMs(eventsA) - resolveLeagueSectionStartTimeMs(eventsB);
                return startDiff !== 0 ? startDiff : titleA.localeCompare(titleB);
            })
          : entries.sort(([titleA], [titleB]) => titleA.localeCompare(titleB));

    return sortedEntries
        .map(([title, sectionEvents]) => ({
            id: `league-${title}`,
            title,
            events: options?.sortByStartTime ? [...sectionEvents].sort(compareSportsEventsByStartTime) : sectionEvents,
        }))
        .filter((section) => section.events.length > 0);
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
