import type { PolymarketEvent } from '@/providers/types/Firefly.js';

export function resolveBetEventPageConfig(event: PolymarketEvent, conditionId: string) {
    const moneyLineMarket = event.markets.find((m) => m.sportsMarketType?.toLowerCase() === 'moneyline');
    const teams = event.drawTeams?.length === 2 ? event.drawTeams : moneyLineMarket?.teams;
    const homeTeam = teams?.[0];
    const awayTeam = teams?.[1];
    if (!homeTeam || !awayTeam) return null;

    const pageTitle = `${homeTeam.name || homeTeam.abbreviation || 'Home Team'} vs ${awayTeam.name || awayTeam.abbreviation || 'Away Team'}`;
    const currentMarket = event.markets.find((m) => m.conditionId === conditionId);
    const leftTeam = currentMarket?.teams?.[0];
    const rightTeam = currentMarket?.teams?.[1];

    return {
        pageTitle,
        leftColor: leftTeam?.color,
        rightColor: rightTeam?.color,
        leftTitle: leftTeam?.alias || leftTeam?.abbreviation || leftTeam?.name,
        rightTitle: rightTeam?.alias || rightTeam?.abbreviation || rightTeam?.name,
    };
}
