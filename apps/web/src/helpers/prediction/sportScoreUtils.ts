import type { BetsMarketDataForUI } from '@/types/prediction.js';
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
}

export function matchesTeamLabel(team: TeamLike, label: string | undefined): boolean {
    const normalizedLabel = normalizeLabel(label);
    if (!normalizedLabel) return false;

    for (const value of [team.name, team.abbreviation]) {
        if (normalizeLabel(value) === normalizedLabel) return true;
    }

    return false;
}

export function getPrimaryMarket(markets: BetsMarketDataForUI[]) {
    return (
        markets.find((market) => market.sportsMarketType?.toLowerCase() === SportMarketGroupType.Moneyline) ||
        markets[0]
    );
}

export function formatLine(line: number, showPositiveSign = true): string {
    if (line === 0) return '0';
    const sign = showPositiveSign && line > 0 ? '+' : '';
    return `${sign}${line}`;
}
