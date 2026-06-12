import { first } from 'lodash-es';

import { matchesTeamLabel } from '@/helpers/prediction/sportScoreUtils.js';
import type { BetsEventDataForUI, BetsMarketDataForUI, SportTeam } from '@/types/prediction.js';

export interface GameMarketOgData {
    /** Left-hand team (home). */
    homeTeam: SportTeam;
    /** Right-hand team (away). */
    awayTeam: SportTeam;
    /** Home win probability, normalized between the two teams (0-100, ≤1 decimal). */
    homePercent: number;
    /** Away win probability, normalized between the two teams (0-100, ≤1 decimal). */
    awayPercent: number;
    /** Home bar fill ratio (0-1), normalized so home + away = 1. */
    homeRatio: number;
    /** Away bar fill ratio (0-1), normalized so home + away = 1. */
    awayRatio: number;
    /** Raw event volume string (formatted at render time). */
    volume: string;
}

function getMoneylineMarket(markets: BetsMarketDataForUI[]): BetsMarketDataForUI | undefined {
    return markets.find((market) => market.sportsMarketType?.toLowerCase().includes('moneyline')) ?? first(markets);
}

function pickTeamPrice(market: BetsMarketDataForUI, team: SportTeam): number | undefined {
    const outcome = market.outcomes.find((o) => matchesTeamLabel(team, o.label));
    if (!outcome) return undefined;
    const price = Number.parseFloat(outcome.price);
    return Number.isFinite(price) ? price : undefined;
}

function roundPercent(value: number): number {
    return Math.round(value * 10) / 10;
}

/**
 * Resolves the data needed to render the dedicated "game" OG image (FW-7744) for a Polymarket
 * sport head-to-head event. Returns `null` for any event that should keep the generic OG layout
 * (non-sport events, missing teams, or markets without usable win probabilities).
 *
 * The percentage bar is normalized between the home and away teams only — for 3-way (draw)
 * markets the draw outcome is ignored, matching the two-team design.
 */
export function resolveGameMarketOgData(event: BetsEventDataForUI): GameMarketOgData | null {
    const sportData = event.sportData;
    if (!sportData?.gameId) return null;

    const { homeTeam, awayTeam } = sportData;
    if (!homeTeam || !awayTeam) return null;

    const market = getMoneylineMarket(event.markets);
    if (!market) return null;

    let homePrice = pickTeamPrice(market, homeTeam);
    let awayPrice = pickTeamPrice(market, awayTeam);

    // Fall back to positional outcomes when labels don't match the team names.
    if (homePrice === undefined || awayPrice === undefined) {
        homePrice = Number.parseFloat(market.outcomes[0]?.price ?? '');
        awayPrice = Number.parseFloat(market.outcomes[1]?.price ?? '');
    }

    if (!Number.isFinite(homePrice) || !Number.isFinite(awayPrice)) return null;

    const total = homePrice + awayPrice;
    if (total <= 0) return null;

    const homeRatio = homePrice / total;
    const awayRatio = awayPrice / total;

    return {
        homeTeam,
        awayTeam,
        homePercent: roundPercent(homeRatio * 100),
        awayPercent: roundPercent(awayRatio * 100),
        homeRatio,
        awayRatio,
        volume: event.volume,
    };
}
