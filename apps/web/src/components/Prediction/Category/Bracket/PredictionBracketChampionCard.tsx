'use client';

import CupIcon from '@dimensiondev/assets/cup.svg';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import type { FifaBracketTeam } from '@/helpers/prediction/category/bracket/types.js';
import { useLocalizedSportsTeamName } from '@/hooks/prediction/useLocalizedSportsTeamName.js';

interface Props {
    team: FifaBracketTeam | null;
}

export const PredictionBracketChampionCard = memo<Props>(function PredictionBracketChampionCard({ team }) {
    const localize = useLocalizedSportsTeamName();

    return (
        <div
            className="rounded-2xl border border-warn p-4 text-center"
            style={{ backgroundImage: 'linear-gradient(180deg, #FFF7E0 0%, #FBE8B5 100%)' }}
        >
            <CupIcon width={36} height={36} className="mx-auto block text-warn" />
            <span className="mt-2 block text-sm font-bold uppercase tracking-wide text-warn">
                <Trans>Champion</Trans>
            </span>
            <span className="mx-auto my-2 block h-px w-2/3 bg-warn/30" />
            {team ? (
                <div className="flex items-center justify-center gap-2">
                    {team.flagUrl ? (
                        <img src={team.flagUrl} alt="" className="h-5 w-[30px] shrink-0 rounded object-cover" />
                    ) : (
                        <span className="h-5 w-[30px] shrink-0 rounded bg-bg" />
                    )}
                    <span className="min-w-0 truncate text-sm font-semibold text-main">{localize(team.name)}</span>
                </div>
            ) : (
                <span className="text-sm font-medium text-second">
                    <Trans>TBD</Trans>
                </span>
            )}
        </div>
    );
});
