'use client';

import { classNames } from '@dimensiondev/utils';
import { memo } from 'react';

function formatScore(value: number | undefined) {
    return value === undefined ? '-' : value;
}

export const SportTennisScoreValue = memo(function SportTennisScoreValue({
    value,
    tieBreakScore,
    muted,
}: {
    value: number | undefined;
    tieBreakScore?: number;
    muted?: boolean;
}) {
    return (
        <span className={classNames('leading-6', muted ? 'text-third' : 'text-lightMain')}>
            {formatScore(value)}
            {tieBreakScore === undefined ? null : (
                <sup className="text-[10px] leading-none" aria-label={`Tie-break ${tieBreakScore}`}>
                    {tieBreakScore}
                </sup>
            )}
        </span>
    );
});
