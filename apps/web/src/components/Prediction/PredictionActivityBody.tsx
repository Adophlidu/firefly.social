'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { type CSSProperties, memo, type ReactNode } from 'react';

import { PredictionActivityRate } from '@/components/Prediction/PredictionActivityRate.js';
import { PredictionActivityResult } from '@/components/Prediction/PredictionActivityResult.js';
import { PredictionActivityTxType } from '@/components/Prediction/PredictionActivityTxType.js';
import { PredictionEventImage } from '@/components/Prediction/PredictionEventImage.js';
import { toFixedTrimmed } from '@/helpers/polymarket.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

function floor(num: number | string) {
    return Number.isNaN(+num) ? 0 : Math.floor(+num);
}

interface PredictionActivityBodyProps {
    activity: BetsActivity;
    className?: string;
    style?: CSSProperties;
    wrapper?: (children: ReactNode) => ReactNode;
}

export const PredictionActivityBody = memo<PredictionActivityBodyProps>(function PredictionActivityBody({
    activity,
    className,
    style,
    wrapper,
}) {
    const isDarkMode = useIsDarkMode();
    const conditionOutcomes = activity.conditionOutcomes ?? [];
    const outcomeIndex = activity.outcomeIndex ?? 0;
    const isLeft = outcomeIndex === 0;
    const outcome = conditionOutcomes[outcomeIndex] || activity.outcome;

    const containerStyle = {
        '--success-color': isDarkMode ? '#1F4B1A' : '#C1E7BD',
        '--danger-color': isDarkMode ? '#66120D' : '#FFD5D2',
        ...style,
    } as CSSProperties;
    const displayTitle =
        activity.platform === PredictionPlatform.Opinion
            ? compact([activity.parent_title, activity.title]).join(' - ')
            : activity.title;

    const content = (
        <>
            <PredictionActivityTxType type={activity.side} usdcSize={activity.usdcSize} platform={activity.platform} />
            <div className="border-line mt-1.5 rounded-2xl border p-4">
                <div className="flex gap-x-2">
                    <PredictionEventImage
                        platform={activity.platform}
                        alt={activity.title}
                        width={24}
                        height={24}
                        className="shrink-0"
                        src={activity.image}
                    />
                    <span className="text-lightMain line-clamp-2 text-sm font-semibold leading-6">{displayTitle}</span>
                </div>
                <div className="mt-3 flex items-center gap-x-1 text-sm font-medium">
                    <span
                        className={classNames('rounded-lg px-2 leading-6', {
                            'bg-success/20 text-success': isLeft,
                            'bg-danger/20 text-danger': !isLeft,
                        })}
                    >
                        {outcome} - {floor(+activity.price * 100)}¢
                    </span>
                    <span className="bg-lightBg text-lightMain min-h-6 rounded-lg px-2 leading-6">
                        <Trans>×{toFixedTrimmed(+activity.size, 2)} shares</Trans>
                    </span>
                </div>
                {activity.umaResolutionStatus === 'resolved' ? (
                    <PredictionActivityResult activity={activity} />
                ) : (
                    <PredictionActivityRate activity={activity} />
                )}
            </div>
        </>
    );

    return (
        <div className={classNames('mt-1.5 block flex-1', className)} style={containerStyle}>
            {wrapper ? wrapper(content) : content}
        </div>
    );
});
