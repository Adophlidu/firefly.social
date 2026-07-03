import type { BetsMarketDataForUI, PenaltyShootout, SportScore } from '@/types/prediction.js';
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

export function matchesTeamLabel(team: TeamLike, label: string | undefined): boolean {
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
