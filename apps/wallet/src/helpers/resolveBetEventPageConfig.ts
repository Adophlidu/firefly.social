import type { PolymarketEvent } from '@/providers/types/Firefly.js';

export function resolveBetEventPageConfig(event: PolymarketEvent, conditionId: string) {
    const moneyLineMarket = event.markets.find((m) => m.sportsMarketType?.toLowerCase() === 'moneyline');
    const teams = event.drawTeams?.length === 2 ? event.drawTeams : moneyLineMarket?.teams;
    const homeTeam = teams?.[0];
    const awayTeam = teams?.[1];
    if (!homeTeam || !awayTeam) return null;

    const pageTitle = `${homeTeam.name || homeTeam.abbreviation || 'Home Team'} vs ${awayTeam.name || awayTeam.abbreviation || 'Away Team'}`;
    const currentMarket = event.markets.find((m) => m.conditionId === conditionId);
    // Regular binary markets (non-draw events)
    const leftTeam = currentMarket?.teams?.[0];
    const rightTeam = currentMarket?.teams?.[1];

    // Three-way (draw) events: each market is binary Yes/No.
    // Use groupTypeFF to determine which team/outcome this market represents.
    if (event.isDraw) {
        const groupType = currentMarket?.groupTypeFF;
        if (groupType === 1) {
            return {
                pageTitle,
                image: event.image || undefined,
                leftColor: leftTeam?.color,
                rightColor: rightTeam?.color,
                leftTitle: 'Draw',
                rightTitle: 'No Draw',
            };
        }

        // Home (0) or away (2) market — resolve team from event-level teams
        const team = groupType === 0 ? homeTeam : groupType === 2 ? awayTeam : null;
        if (team) {
            const teamLabel = team.name || team.alias || team.abbreviation?.toUpperCase();
            return {
                pageTitle,
                image: team.logo || undefined,
                leftColor: team.color,
                rightColor: undefined,
                // Title line 2 shows team name; buttons stay Yes/No (raw outcomes)
                selectedOutcomeTitle: teamLabel,
            };
        }
    }

    return {
        pageTitle,
        leftColor: leftTeam?.color,
        rightColor: rightTeam?.color,
        leftTitle: leftTeam?.alias || leftTeam?.abbreviation?.toUpperCase() || leftTeam?.name,
        rightTitle: rightTeam?.alias || rightTeam?.abbreviation?.toUpperCase() || rightTeam?.name,
    };
}
