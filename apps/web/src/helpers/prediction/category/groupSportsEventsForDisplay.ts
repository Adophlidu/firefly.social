import { t } from '@lingui/core/macro';
import dayjs from 'dayjs';

import type {
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
