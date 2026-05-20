import {
    formatPriceCents,
    parsePolymarketStringArray,
    type PredictionSportsCellViewModel,
} from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import type { MarketPriceChangeData } from '@/providers/prediction/polymarket/MarketsWebSocketProvider.js';
import type { PolymarketSportsEvent, PolymarketSportsMarketData } from '@/providers/types/Firefly.js';

function isLiveSportsGameStatus(gameStatus: PolymarketSportsEvent['game_status']): boolean {
    return gameStatus === 0 || gameStatus === '0' || gameStatus === 'live';
}

function findMoneylineMarket(event: PolymarketSportsEvent): PolymarketSportsMarketData | undefined {
    return event.markets?.find((market) => (market as PolymarketSportsMarketData).sportsMarketType === 'moneyline') as
        | PolymarketSportsMarketData
        | undefined;
}

function getMoneylineMarkets(event: PolymarketSportsEvent): PolymarketSportsMarketData[] {
    return (
        (event.markets?.filter((market) => (market as PolymarketSportsMarketData).sportsMarketType === 'moneyline') as
            | PolymarketSportsMarketData[]
            | undefined) ?? []
    );
}

function getMarketYesAssetId(market: PolymarketSportsMarketData | undefined): string | undefined {
    if (!market) return undefined;
    return parsePolymarketStringArray(market.clobTokenIds)[0];
}

/** Buy buttons show the ask side, matching PredictionMarketBuyButtons / BetEventClient. */
export function resolveWsOutcomeDisplayPrice(change: MarketPriceChangeData): string | undefined {
    const bestAsk = change.best_ask?.trim();
    if (bestAsk !== undefined && bestAsk !== '') return bestAsk;

    const price = change.price?.trim();
    if (price) return price;

    return undefined;
}

function isDrawMarketTitle(title: string | undefined): boolean {
    return title?.toLowerCase().includes('draw') ?? false;
}

function matchesTeamMarketTitle(
    team: { name?: string; abbreviation?: string; alias?: string } | undefined,
    title: string | undefined,
): boolean {
    if (!team || !title || isDrawMarketTitle(title)) return false;
    const normalizedTitle = title.trim().toLowerCase();
    return [team.name, team.abbreviation, team.alias]
        .filter(Boolean)
        .some((value) => value!.trim().toLowerCase() === normalizedTitle);
}

function resolveThreeWayMarkets(
    markets: PolymarketSportsMarketData[],
    homeTeam: { name?: string; abbreviation?: string; alias?: string },
    awayTeam: { name?: string; abbreviation?: string; alias?: string },
): PolymarketSportsMarketData[] {
    const byGroupType = (type: number) => markets.find((market) => market.groupTypeFF === type);

    let homeMarket = byGroupType(0);
    let drawMarket = byGroupType(1);
    let awayMarket = byGroupType(2);

    if (!drawMarket) {
        drawMarket = markets.find((market) => isDrawMarketTitle(market.groupItemTitle));
    }
    if (!homeMarket) {
        homeMarket = markets.find((market) => matchesTeamMarketTitle(homeTeam, market.groupItemTitle));
    }
    if (!awayMarket) {
        awayMarket = markets.find(
            (market) =>
                market !== homeMarket &&
                market !== drawMarket &&
                matchesTeamMarketTitle(awayTeam, market.groupItemTitle),
        );
    }
    if (!awayMarket) {
        awayMarket = markets.find((market) => market !== homeMarket && market !== drawMarket);
    }

    return [homeMarket, drawMarket, awayMarket].filter(Boolean) as PolymarketSportsMarketData[];
}

/** CLOB asset ids for YES outcomes shown on sports list price buttons. */
export function collectSportsEventMarketAssetIds(event: PolymarketSportsEvent): string[] {
    if (event.isDraw && event.drawTeams && event.drawTeams.length >= 2) {
        const moneylineMarkets = getMoneylineMarkets(event);
        if (moneylineMarkets.length < 3) return [];

        const [homeTeamData, awayTeamData] = event.drawTeams;
        return resolveThreeWayMarkets(moneylineMarkets, homeTeamData, awayTeamData)
            .map(getMarketYesAssetId)
            .filter((id): id is string => !!id);
    }

    const moneyline = findMoneylineMarket(event);
    if (!moneyline) return [];

    return parsePolymarketStringArray(moneyline.clobTokenIds);
}

export function collectLiveSportsMarketAssetIds(events: PolymarketSportsEvent[]): string[] {
    const ids = new Set<string>();

    for (const event of events) {
        if (!isLiveSportsGameStatus(event.game_status)) continue;

        for (const assetId of collectSportsEventMarketAssetIds(event)) {
            ids.add(assetId);
        }
    }

    return [...ids];
}

export function applySportsMarketPriceOverrides(
    model: PredictionSportsCellViewModel,
    pricesByAssetId: Record<string, string>,
): PredictionSportsCellViewModel {
    const patchTeam = (team: PredictionSportsCellViewModel['homeTeam']) => {
        if (!team.assetId) return team;
        const price = pricesByAssetId[team.assetId];
        if (!price) return team;
        return { ...team, priceCents: formatPriceCents(price) };
    };

    const drawOutcome =
        model.drawOutcome?.assetId && pricesByAssetId[model.drawOutcome.assetId]
            ? {
                  ...model.drawOutcome,
                  priceCents: formatPriceCents(pricesByAssetId[model.drawOutcome.assetId]),
              }
            : model.drawOutcome;

    return {
        ...model,
        homeTeam: patchTeam(model.homeTeam),
        awayTeam: patchTeam(model.awayTeam),
        drawOutcome,
    };
}
