'use client';

import { hexToRGBA } from '@dimensiondev/utils';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import { toFixedTrimmed } from '@/helpers/polymarket.js';
import type { BetsActivity, SportActivityTeam } from '@/providers/types/Firefly.js';

const HOME_FALLBACK_COLOR = '#3DC233';
const AWAY_FALLBACK_COLOR = '#FF3545';

function floor(num: number | string) {
    return Number.isNaN(+num) ? 0 : Math.floor(+num);
}

function resolveBetTeam(activity: BetsActivity): { label: string; color: string } | null {
    const sport = activity.sportData;
    const outcomeIndex = activity.outcomeIndex ?? 0;

    // Resolve which team array to use — same priority as SportTimelineActivityCard
    const teams: SportActivityTeam[] =
        sport?.isDraw && sport.drawTeams?.length === 2
            ? sport.drawTeams
            : sport?.marketTeams?.length === 2
              ? sport.marketTeams
              : sport?.drawTeams?.length === 2
                ? sport.drawTeams
                : [];

    const conditionOutcomes = activity.conditionOutcomes ?? [];

    if (teams.length === 2) {
        // Check if this is a draw outcome in a three-way market
        const labels = conditionOutcomes.length >= 3 ? conditionOutcomes : [];
        const isDrawOutcome =
            labels.length > 2 && (labels[outcomeIndex]?.trim().toLowerCase() === 'draw' || outcomeIndex === 2);

        if (isDrawOutcome && sport?.isDraw) {
            return {
                label: t`Draw`,
                color: '#7B7B7B',
            };
        }

        // outcomeIndex 0 → home, otherwise → away
        const isHome = outcomeIndex === 0;
        const team = isHome ? teams[0] : teams[1];
        const fallbackColor = isHome ? HOME_FALLBACK_COLOR : AWAY_FALLBACK_COLOR;

        return {
            label:
                team?.abbreviation?.trim() || team?.name?.trim() || conditionOutcomes[outcomeIndex] || activity.outcome,
            color: team?.color || fallbackColor,
        };
    }

    // Fallback: use condition outcome or activity outcome text
    const fallbackLabel = conditionOutcomes[outcomeIndex] || activity.outcome;
    if (!fallbackLabel) return null;

    return {
        label: fallbackLabel,
        color: outcomeIndex === 0 ? HOME_FALLBACK_COLOR : AWAY_FALLBACK_COLOR,
    };
}

interface SportBetInfoPillsProps {
    activity: BetsActivity;
}

export const SportBetInfoPills = memo<SportBetInfoPillsProps>(function SportBetInfoPills({ activity }) {
    const resolved = resolveBetTeam(activity);
    if (!resolved) return null;

    const priceCents = floor(+activity.price * 100);

    return (
        <div className="mt-1.5 flex items-center gap-x-1 text-sm font-medium">
            <span
                className="rounded-lg px-2 uppercase leading-6"
                style={{
                    backgroundColor: hexToRGBA(resolved.color, 0.12),
                    color: resolved.color,
                }}
            >
                {resolved.label} - {priceCents}¢
            </span>
            <span className="min-h-6 rounded-lg bg-lightBg px-2 leading-6 text-lightMain">
                <Trans>×{toFixedTrimmed(+activity.size, 2)} shares</Trans>
            </span>
        </div>
    );
});
