'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import { PredictionPlatform } from '@/constants/enum.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { computeVolume } from '@/helpers/polymarket.js';
import { type BetsActivity } from '@/providers/types/Firefly.js';

interface ActivityResultProps {
    activity: BetsActivity;
}

export function PredictionActivityResult({ activity }: ActivityResultProps) {
    const isLeft = activity.resolvedResult === 0 || activity.conditionOutcomePrices[0] === '1';
    const outcome = isLeft ? activity.conditionOutcomes[0] : activity.conditionOutcomes[1];

    return (
        <div className="mt-3 text-left">
            <div className={classNames('text-sm font-semibold', isLeft ? 'text-success' : 'text-danger')}>
                <Trans>Settled as {outcome}</Trans>
            </div>
            <div className={classNames('mt-1 h-1', isLeft ? 'bg-success' : 'bg-danger')} />
            <div className="mt-3 text-xs font-medium text-second">
                $
                {activity.platform === PredictionPlatform.Opinion
                    ? nFormatter(parseFloat(activity.volume), 2)
                    : computeVolume(activity, isLeft ? 0 : 1)}
            </div>
        </div>
    );
}
