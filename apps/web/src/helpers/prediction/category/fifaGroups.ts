import { removeTrailingZeros } from '@dimensiondev/utils';

import type { FifaGroupScoreTeam } from '@/providers/types/Firefly.js';

type FifaAdvancePercentInput = Pick<FifaGroupScoreTeam, 'advance_probability' | 'advance_probability_percent'>;

function normalizePercent(value: number | undefined): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    return value <= 1 ? value * 100 : value;
}

/** Formats a 0–100 percentage as a rounded, trailing-zero-trimmed string, e.g. `56%` / `19.5%`. */
export function formatPercent(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
    return `${removeTrailingZeros((Math.round(value * 10) / 10).toFixed(1))}%`;
}

export function formatFifaAdvancePercent(team: FifaAdvancePercentInput): string {
    const percent = normalizePercent(team.advance_probability_percent) ?? normalizePercent(team.advance_probability);
    return formatPercent(percent);
}
