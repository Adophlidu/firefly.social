import { removeTrailingZeros } from '@dimensiondev/utils';

import type { FifaGroupScoreTeam } from '@/providers/types/Firefly.js';

type FifaAdvancePercentInput = Pick<FifaGroupScoreTeam, 'advance_probability' | 'advance_probability_percent'>;

function normalizePercent(value: number | undefined): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    return value <= 1 ? value * 100 : value;
}

export function formatFifaAdvancePercent(team: FifaAdvancePercentInput): string {
    const percent = normalizePercent(team.advance_probability_percent) ?? normalizePercent(team.advance_probability);
    if (typeof percent !== 'number') return '—';
    return `${removeTrailingZeros((Math.round(percent * 10) / 10).toFixed(1))}%`;
}
