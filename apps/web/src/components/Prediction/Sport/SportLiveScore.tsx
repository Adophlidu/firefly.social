'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo } from 'react';

import type { SportScore } from '@/types/prediction.js';

interface SportLiveScoreProps {
    scores: SportScore[];
    period?: string;
}

function formatSingleScore(scores: SportScore[]): string {
    if (!scores.length || !scores[0].score?.length) return '0 - 0';
    const s = scores[0].score;
    return `${s[0] ?? 0} - ${s[1] ?? 0}`;
}

function formatMultipleScores(scores: SportScore[]) {
    return scores.map((set, i) => {
        if (!set.score?.length) return null;
        const home = set.score[0] ?? 0;
        const away = set.score[1] ?? 0;
        return (
            <div key={i} className="flex items-center gap-2 text-xs">
                <span className={classNames(home > away ? 'font-bold text-lightMain' : 'text-third')}>{home}</span>
                <span className="text-third">-</span>
                <span className={classNames(away > home ? 'font-bold text-lightMain' : 'text-third')}>{away}</span>
            </div>
        );
    });
}

export const SportLiveScore = memo(function SportLiveScore({ scores, period }: SportLiveScoreProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="rounded bg-danger px-1.5 py-0.5 text-xs font-bold text-white">
                <Trans>LIVE</Trans>
            </span>
            {period ? <span className="text-xs text-second">{period}</span> : null}
            <div className="flex items-center gap-1">
                {scores.length > 1 ? (
                    <div className="flex flex-col gap-0.5">{formatMultipleScores(scores)}</div>
                ) : (
                    <span className="text-sm font-bold text-lightMain">{formatSingleScore(scores)}</span>
                )}
            </div>
        </div>
    );
});
