import { first } from 'lodash-es';

import { getLoser, getSingleScore, matchesTeamLabel } from '@/helpers/prediction/sportScoreUtils.js';
import type { BetsEventDataForUI, BetsMarketDataForUI, SportScore, SportTeam } from '@/types/prediction.js';
import { SportScoreType } from '@/types/prediction.js';

/**
 * Which center block the game OG image renders, mirroring SportTeamDataDisplay:
 * `upcoming` → win-probability bar; `live`/`ended` → score.
 */
export type GameMarketState = 'upcoming' | 'live' | 'ended';

export interface GameMarketOgData {
    /** Left-hand team (home). */
    homeTeam: SportTeam;
    /** Right-hand team (away). */
    awayTeam: SportTeam;
    /** Home win probability (0-100, integer), normalized across home/away/draw to match the detail page. */
    homePercent: number;
    /** Away win probability (0-100, integer), normalized across home/away/draw to match the detail page. */
    awayPercent: number;
    /** Home bar fill ratio (0-1), normalized so home + away = 1. */
    homeRatio: number;
    /** Away bar fill ratio (0-1), normalized so home + away = 1. */
    awayRatio: number;
    /** Raw event volume string (formatted at render time). */
    volume: string;
    /** League / competition name shown under the title (e.g. "LOL"); omitted when unavailable. */
    leagueName?: string;
    /** Game lifecycle state — decides whether the OG shows the probability bar or the score. */
    state: GameMarketState;
    /** Per-set scores (single entry for non-tennis games). */
    scores: SportScore[];
    /** Home score of the primary score row. */
    homeScore: number;
    /** Away score of the primary score row. */
    awayScore: number;
    /** True for multi-set (tennis) scoring, where each set is rendered as its own column. */
    multipleSets: boolean;
    /** Losing side, muted when the game has ended. */
    loser?: 'home' | 'away';
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

/**
 * Resolves the data needed to render the dedicated "game" OG image (FW-7744) for a Polymarket
 * sport head-to-head event. Returns `null` for any event that should keep the generic OG layout
 * (non-sport events, missing teams, or markets without usable win probabilities).
 *
 * For upcoming games the displayed percentages include the draw outcome (3-way markets) in the
 * denominator so they match the event detail page (SportTeamDataDisplay), which normalizes across
 * home/away/draw. The bar fill (homeRatio/awayRatio) stays two-team — normalized between home and
 * away only — so its two segments still span the full bar. Once a game is live or ended, the
 * detail page swaps the probability bar for the score, so the returned `state`/score fields let
 * the OG image do the same.
 */
export function resolveGameMarketOgData(event: BetsEventDataForUI): GameMarketOgData | null {
    const sportData = event.sportData;
    if (!sportData?.gameId) return null;

    const { homeTeam, awayTeam } = sportData;
    if (!homeTeam || !awayTeam) return null;

    const market = getMoneylineMarket(event.markets);
    if (!market) return null;

    // Game state mirrors SportTeamDataDisplay: live/ended games show the score, upcoming shows the bar.
    const state: GameMarketState = sportData.live ? 'live' : sportData.ended ? 'ended' : 'upcoming';

    let homePrice = pickTeamPrice(market, homeTeam);
    let awayPrice = pickTeamPrice(market, awayTeam);

    // Fall back to positional outcomes when labels don't match the team names.
    if (homePrice === undefined || awayPrice === undefined) {
        homePrice = Number.parseFloat(market.outcomes[0]?.price ?? '');
        awayPrice = Number.parseFloat(market.outcomes[1]?.price ?? '');
    }

    // The win-probability bar (and its percentages/ratios) is only rendered for upcoming games;
    // live/ended games render the score instead, exactly like SportTeamDataDisplay. Once a game ends
    // the moneyline resolves to 0/1, so a draw leaves both home and away at 0 (pairTotal 0) — that
    // must NOT drop the game OG back to the generic prediction layout. Only upcoming games, which
    // actually display the bar, require usable win probabilities.
    const pricesValid = Number.isFinite(homePrice) && Number.isFinite(awayPrice) && homePrice + awayPrice > 0;
    if (state === 'upcoming' && !pricesValid) return null;

    // Bar fill is normalized between the two teams only, so its segments span the full width.
    const pairTotal = pricesValid ? homePrice + awayPrice : 0;
    const homeRatio = pricesValid ? homePrice / pairTotal : 0.5;
    const awayRatio = pricesValid ? awayPrice / pairTotal : 0.5;

    // Displayed percentages include the draw outcome (outcomes[2] on 3-way markets) so they match
    // the detail page, which divides by home + away + draw and rounds to an integer.
    const drawPrice = sportData.isDraw ? Number.parseFloat(market.outcomes[2]?.price ?? '') : Number.NaN;
    const percentTotal = pairTotal + (Number.isFinite(drawPrice) ? drawPrice : 0);

    const [homeScore, awayScore] = getSingleScore(sportData.scores);

    return {
        homeTeam,
        awayTeam,
        homePercent: pricesValid && percentTotal > 0 ? Math.round((homePrice / percentTotal) * 100) : 0,
        awayPercent: pricesValid && percentTotal > 0 ? Math.round((awayPrice / percentTotal) * 100) : 0,
        homeRatio,
        awayRatio,
        volume: event.volume,
        leagueName: sportData.leagueName?.trim() || undefined,
        state,
        scores: sportData.scores,
        homeScore,
        awayScore,
        multipleSets: sportData.scoreType === SportScoreType.Multiple,
        loser:
            state === 'ended' ? getLoser(sportData.winResult, sportData.scores, sportData.penaltyShootout) : undefined,
    };
}
