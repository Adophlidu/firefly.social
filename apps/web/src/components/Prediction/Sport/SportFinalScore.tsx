'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import type { SportScore, SportScoreType, SportTeam } from '@/types/prediction.js';
import { SportScoreType as SportScoreTypeEnum } from '@/types/prediction.js';

interface SportFinalScoreProps {
    homeTeam: SportTeam;
    awayTeam: SportTeam;
    scores: SportScore[];
    scoreType?: SportScoreType;
    winResult?: number;
}

function getSingleFinalScore(scores: SportScore[]): [number, number] {
    if (!scores.length || !scores[0].score?.length) return [0, 0];
    const s = scores[0].score;
    return [s[0] ?? 0, s[1] ?? 0];
}

function MultipleScores({ scores }: { scores: SportScore[] }) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            {scores.map((set, i) => {
                if (!set.score?.length) return null;
                const home = set.score[0] ?? 0;
                const away = set.score[1] ?? 0;
                return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className={classNames(home > away ? 'text-lightMain font-bold' : 'text-third')}>
                            {home}
                        </span>
                        <span className="text-third">-</span>
                        <span className={classNames(away > home ? 'text-lightMain font-bold' : 'text-third')}>
                            {away}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export const SportFinalScore = memo(function SportFinalScore({ scores, scoreType, winResult }: SportFinalScoreProps) {
    const isMultiple = scoreType === SportScoreTypeEnum.Multiple && scores.length > 1;

    if (isMultiple) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-second rounded bg-[#f0f0f0] px-1.5 py-0.5 text-xs font-bold dark:bg-[#3a3a3a]">
                    <Trans>FINAL</Trans>
                </span>
                <MultipleScores scores={scores} />
            </div>
        );
    }

    const [homeScore, awayScore] = getSingleFinalScore(scores);
    const homeWins = winResult === 0;
    const awayWins = winResult === 2;

    return (
        <div className="flex items-center gap-2">
            <span className="text-second rounded bg-[#f0f0f0] px-1.5 py-0.5 text-xs font-bold dark:bg-[#3a3a3a]">
                <Trans>FINAL</Trans>
            </span>
            <div className="flex items-center gap-2">
                <span
                    className={classNames('text-sm font-bold', {
                        'text-lightMain': homeWins || winResult === undefined,
                        'opacity-40': !homeWins && winResult !== undefined,
                    })}
                >
                    {homeScore}
                </span>
                <span className="text-third text-sm">-</span>
                <span
                    className={classNames('text-sm font-bold', {
                        'text-lightMain': awayWins || winResult === undefined,
                        'opacity-40': !awayWins && winResult !== undefined,
                    })}
                >
                    {awayScore}
                </span>
            </div>
        </div>
    );
});
