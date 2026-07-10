import type { BetsMarketDataForUI, PenaltyShootout, SportScore, SportTeam } from '@/types/prediction.js';
import { SportMarketGroupType } from '@/types/prediction.js';

export function getScoreValue(score: number[] | undefined, index: number) {
    const value = score?.[index];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function getTieBreakValue(tieBreakScores: number[] | undefined, index: number) {
    const value = tieBreakScores?.[index];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function compareScorePair(score: number[] | undefined, tieBreakScores?: number[]) {
    const home = getScoreValue(score, 0);
    const away = getScoreValue(score, 1);
    if (home === undefined || away === undefined) return 0;
    if (home !== away) return home > away ? 1 : -1;

    const homeTieBreak = getTieBreakValue(tieBreakScores, 0);
    const awayTieBreak = getTieBreakValue(tieBreakScores, 1);
    if (homeTieBreak === undefined || awayTieBreak === undefined || homeTieBreak === awayTieBreak) return 0;
    return homeTieBreak > awayTieBreak ? 1 : -1;
}

interface ScoreLike {
    score?: number[];
    memo?: number[];
}

export function formatTennisSetKey<T extends ScoreLike>(score: T) {
    return `${score.score?.join('-') || 'score'}:${score.memo?.join('-') || 'tie-break'}`;
}

export function getTennisSetKey<T extends ScoreLike>(scores: T[], index: number) {
    return scores
        .slice(0, index + 1)
        .map(formatTennisSetKey)
        .join('|');
}

export function normalizeLabel(value: string | undefined): string | undefined {
    const normalized = value?.trim().toLowerCase();
    return normalized || undefined;
}

interface TeamLike {
    name?: string;
    abbreviation?: string;
    alias?: string;
}

export function matchesTeamLabel(team: TeamLike | undefined, label: string | undefined): boolean {
    if (!team) return false;
    const normalizedLabel = normalizeLabel(label);
    if (!normalizedLabel) return false;

    for (const value of [team.name, team.abbreviation, team.alias]) {
        if (normalizeLabel(value) === normalizedLabel) return true;
    }

    return false;
}

/** Home/away score of the primary (single-line) score row, defaulting missing values to 0. */
export function getSingleScore(scores: SportScore[]): [number, number] {
    const score = scores[0]?.score;
    return [score?.[0] ?? 0, score?.[1] ?? 0];
}

/** Derive the shootout loser by counting scored kicks; undefined when absent or level. */
export function getPenaltyShootoutLoser(penaltyShootout?: PenaltyShootout): 'home' | 'away' | undefined {
    if (!penaltyShootout) return undefined;
    const homeGoals = penaltyShootout.home.filter((kick) => kick === 1).length;
    const awayGoals = penaltyShootout.away.filter((kick) => kick === 1).length;
    if (homeGoals === awayGoals) return undefined;
    return homeGoals > awayGoals ? 'away' : 'home';
}

/** Resolve the losing side to mute. Falls back to penalty kicks when the match is drawn. */
export function getLoser(
    winResult: number | undefined,
    scores: SportScore[],
    penaltyShootout?: PenaltyShootout,
): 'home' | 'away' | undefined {
    if (winResult === 0) return 'away';
    if (winResult === 2) return 'home';
    if (winResult === 1) return getPenaltyShootoutLoser(penaltyShootout);

    const [homeScore, awayScore] = getSingleScore(scores);
    if (homeScore > awayScore) return 'away';
    if (awayScore > homeScore) return 'home';
    return getPenaltyShootoutLoser(penaltyShootout);
}

export function getPrimaryMarket(markets: BetsMarketDataForUI[]) {
    return (
        markets.find((market) => market.sportsMarketType?.toLowerCase() === SportMarketGroupType.Moneyline) ||
        markets[0]
    );
}

/** Detects a penalty-shootout period label (e.g. "Penalty Shootout", "PENALTY"). */
export function isPenaltyPeriod(period?: string): boolean {
    return !!period && /penalty|shootout/i.test(period);
}

export function formatLine(line: number, showPositiveSign = true): string {
    if (line === 0) return '0';
    const sign = showPositiveSign && line > 0 ? '+' : '';
    return `${sign}${line}`;
}

/** Abbreviate Over/Under labels for total-type markets. "Over 2.5" → "O 2.5", "Over" → "O", "Under 2.5" → "U 2.5", "Under" → "U". No-op for other labels. */
export function abbreviateOutcomeLabel(label: string): string {
    return label.replace(/^Over(\s|$)/i, 'O$1').replace(/^Under(\s|$)/i, 'U$1');
}

/** Finite numeric line stored on a sport market, defaulting to 0 when missing/non-finite. */
export function getMarketLine(market: BetsMarketDataForUI): number {
    return typeof market.line === 'number' && Number.isFinite(market.line) ? market.line : 0;
}

/**
 * Which side a spread market's slug encodes (-spread-home-X / -spread-away-X). undefined when the slug
 * has no side segment, in which case the handicap direction — and therefore the spread winner — is
 * not derivable.
 */
export function getSpreadSide(market: BetsMarketDataForUI): 'home' | 'away' | undefined {
    const match = market.slug?.toLowerCase().match(/-(home|away)-/)?.[1];
    return match === 'home' ? 'home' : match === 'away' ? 'away' : undefined;
}

/**
 * Recover the home-perspective signed handicap. Each spread market stores its own team's handicap
 * (always <= 0); the side lives in the slug (-spread-home-X / -spread-away-X), so an away-side -X
 * market is the home team +X. Defaults to the home perspective when the side can't be parsed
 * (kept for sort-ordering in createSportLineOptions; the resolver bails separately via getSpreadSide).
 */
export function getSpreadSignedLine(market: BetsMarketDataForUI): number {
    const line = getMarketLine(market);
    return getSpreadSide(market) === 'away' ? -line : line;
}

/** Resolve the team object whose name/abbreviation/alias matches the given outcome label. */
export function resolveOutcomeTeam(
    label: string | undefined,
    homeTeam: SportTeam | undefined,
    awayTeam: SportTeam | undefined,
): SportTeam | undefined {
    if (matchesTeamLabel(homeTeam, label)) return homeTeam;
    if (matchesTeamLabel(awayTeam, label)) return awayTeam;
    return undefined;
}

/** Map each outcome label to its matching team (home/away), or undefined when no match. */
export function resolveOutcomeTeams(
    market: BetsMarketDataForUI,
    homeTeam: SportTeam | undefined,
    awayTeam: SportTeam | undefined,
): Array<SportTeam | undefined> {
    return market.outcomes.map((outcome) => resolveOutcomeTeam(outcome.label, homeTeam, awayTeam));
}

/** True when an outcome's price has settled to a decided value (>= 1 = certainty). */
function isDecidedPrice(price: string | undefined): boolean {
    const value = Number.parseFloat(price ?? '0');
    return !Number.isNaN(value) && value >= 1;
}

/**
 * Full-game Moneyline/Spreads/Totals whose winner is derivable from the final score. Admits the bare
 * types AND the soccer/tennis full-game variants, which carry a sport prefix in the feed
 * (formatEvents preserves the group's sportsMarketType verbatim: soccer_spreads/soccer_totals,
 * tennis_moneyline/tennis_spreads). Period variants (first_half_*, q1_*, soccer_second_half_*,
 * soccer_halftime_*) and series/event markets (child_moneyline, game_winner, soccer_team_to_advance,
 * first_to_score, ...) do not match because their prefix is not a sport name.
 */
const FULL_GAME_SCORE_MARKET_TYPE = /^(?:soccer|tennis)?_?(?:moneyline|spreads|totals)$/;

function isFullGameScoreMarket(market: BetsMarketDataForUI): boolean {
    return FULL_GAME_SCORE_MARKET_TYPE.test(market.sportsMarketType?.toLowerCase() ?? '');
}

export interface ResolvedSportOutcomeContext {
    scores: SportScore[];
    winResult?: number;
    penaltyShootout?: PenaltyShootout;
    homeTeam?: SportTeam;
    awayTeam?: SportTeam;
}

export interface ResolvedSportOutcome {
    index: number;
    team?: SportTeam;
}

/**
 * Resolve the winning outcome of a sport sub-market once the game has ended / the market has settled.
 * Layered: prefer formal UMA resolution, then a price decided at certainty, then final-score math so a
 * result appears the moment the game ends (before UMA settles). Returns undefined when the winner
 * cannot be derived (e.g. "Other" markets, period/event markets, or a push/tie).
 *
 * NOTE: score math reads the full-game score and is a best-effort heuristic for the moment the game
 * ends; callers should only mount the result label for ended/closed games.
 */
export function getResolvedSportOutcome(
    market: BetsMarketDataForUI,
    renderAs: SportMarketGroupType,
    ctx: ResolvedSportOutcomeContext,
): ResolvedSportOutcome | undefined {
    const teams = resolveOutcomeTeams(market, ctx.homeTeam, ctx.awayTeam);

    // 1. Formal resolution (UMA).
    if (market.resolvedOutcomeId) {
        const index = market.outcomes.findIndex((outcome) => outcome.id === market.resolvedOutcomeId);
        if (index >= 0) return { index, team: teams[index] };
    }

    // 2. Price decided at certainty.
    const decidedIndex = market.outcomes.findIndex((outcome) => isDecidedPrice(outcome.price));
    if (decidedIndex >= 0) return { index: decidedIndex, team: teams[decidedIndex] };

    // 3. Final-score math — only the full-game Moneyline/Spreads/Totals derive a winner from the
    // final score. Period variants (1st-half, quarters), series/event markets (child_moneyline,
    // team-to-advance, first-to-score), and Other reuse the same renderAs but their outcomes are
    // not derivable from the full-game score; stop here so we never show a wrong result pre-UMA.
    if (!isFullGameScoreMarket(market)) return undefined;

    const [homeScore, awayScore] = getSingleScore(ctx.scores);
    const winnerSide = resolveWinnerSide(ctx);

    switch (renderAs) {
        case SportMarketGroupType.Moneyline: {
            if (!winnerSide) {
                // Draw: a 3-way moneyline resolves to its Draw outcome (the non-team leg, index 2 per
                // mergeThreeWayMarketsOfType). A 2-way moneyline cannot draw, so stay undefined.
                const drawIndex = market.outcomes.findIndex((_, i) => i >= 2 && !teams[i]);
                return drawIndex >= 0 ? { index: drawIndex } : undefined;
            }
            return pickTeamOutcome(teams, winnerSide, ctx);
        }
        case SportMarketGroupType.Spread: {
            // The handicap direction lives in the slug; without a -home-/-away- segment we can't pick
            // a side, so wait for formal/price resolution rather than guess.
            if (!getSpreadSide(market)) return undefined;
            const homeMargin = homeScore + getSpreadSignedLine(market) - awayScore;
            if (homeMargin === 0) return undefined;
            return pickTeamOutcome(teams, homeMargin > 0 ? 'home' : 'away', ctx);
        }
        case SportMarketGroupType.Total: {
            // A missing/non-finite line can't be compared; wait for formal/price resolution.
            if (typeof market.line !== 'number' || !Number.isFinite(market.line)) return undefined;
            const combined = homeScore + awayScore;
            if (combined === market.line) return undefined;
            // Match the Over/Under side by leading letter (labels may be full words or O/U abbreviations).
            const pattern = combined > market.line ? /^o/i : /^u/i;
            const index = market.outcomes.findIndex((outcome) => pattern.test(outcome.label.trim()));
            return index >= 0 ? { index } : undefined;
        }
        default:
            // Other (BTTS, etc.) is not derivable from final scores.
            return undefined;
    }
}

/** Resolve the winning side from winResult, falling back to score comparison. undefined for a draw/tie. */
function resolveWinnerSide(ctx: ResolvedSportOutcomeContext): 'home' | 'away' | undefined {
    if (ctx.winResult === 0) return 'home';
    if (ctx.winResult === 2) return 'away';
    if (ctx.winResult === 1) return undefined;

    const primary = ctx.scores[0];
    const cmp = compareScorePair(primary?.score, primary?.memo);
    if (cmp > 0) return 'home';
    if (cmp < 0) return 'away';
    return undefined;
}

/** Find the outcome whose team matches the winning side; undefined when no outcome matches. */
function pickTeamOutcome(
    teams: Array<SportTeam | undefined>,
    side: 'home' | 'away',
    ctx: ResolvedSportOutcomeContext,
): ResolvedSportOutcome | undefined {
    const targetTeam = side === 'home' ? ctx.homeTeam : ctx.awayTeam;
    const index = teams.findIndex((team) => !!team && !!targetTeam && team === targetTeam);
    return index >= 0 ? { index, team: teams[index] } : undefined;
}

/**
 * Whether a market's line group should default to its FIRST listed line (feed order) instead of the
 * desirability pick (findDefaultMarket). Applies to team totals, player props, and corners, matching
 * Polymarket — parseLinesWithMarket leaves these unsorted, so section.markets[0] is the default.
 */
export function isFirstLineDefaultMarket(market: BetsMarketDataForUI): boolean {
    const type = market.sportsMarketType?.toLowerCase() ?? '';
    return type.includes('team_total') || type.startsWith('soccer_player_') || type.includes('total_corners');
}
