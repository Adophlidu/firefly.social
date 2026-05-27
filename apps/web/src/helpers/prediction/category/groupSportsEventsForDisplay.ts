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

export function groupLiveSportsListForDisplay(response: PolymarketSportsListResponse): LiveSportsListDisplay {
    const timeSections: LiveSportsTimeSection[] = [];

    const liveLeagueSections = groupLiveSportsEventsByLeague(response.live);
    if (liveLeagueSections.length > 0) {
        timeSections.push({
            id: 'live',
            title: t`Live`,
            sportSections: liveLeagueSections,
        });
    }

    const startingSoonLeagueSections = groupLiveSportsEventsByLeague(response.today);
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

export function groupLiveSportsEventsByLeague(events: PolymarketSportsEvent[]): SportsEventDisplaySection[] {
    const grouped = new Map<string, PolymarketSportsEvent[]>();

    for (const event of events) {
        if (!isDisplayableSportsEvent(event)) continue;

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
