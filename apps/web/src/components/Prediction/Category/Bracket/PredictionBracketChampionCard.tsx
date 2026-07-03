'use client';

import TrophyIcon from '@dimensiondev/assets/trophy-gold.svg';
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
        <div className="flex h-full items-center justify-center gap-3 rounded-xl border-2 border-[#da9111] bg-lightBottom px-8 py-3 dark:bg-darkBottom">
            <TrophyIcon className="h-16 w-[56px] shrink-0" />
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
                {team?.flagUrl ? (
                    <img src={team.flagUrl} alt="" className="h-[30px] w-[45px] rounded object-cover" />
                ) : (
                    <span className="h-[30px] w-[45px] rounded-lg bg-bg" />
                )}
                <span className="min-w-0 truncate text-sm font-semibold text-main">
                    {team ? localize(team.name) : <Trans>TBD</Trans>}
                </span>
            </div>
        </div>
    );
});
