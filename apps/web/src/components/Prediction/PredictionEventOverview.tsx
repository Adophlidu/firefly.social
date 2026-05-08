'use client';

import TimeIcon from '@dimensiondev/assets/time.svg';
import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { use } from 'react';

import { PredictionContext } from '@/components/Prediction/PredictionContext.js';
import { PredictionEventEndTime } from '@/components/Prediction/PredictionEventEndTime.js';
import { PredictionEventImage } from '@/components/Prediction/PredictionEventImage.js';
import { PredictionEventTimeRange } from '@/components/Prediction/PredictionEventTimeRange.js';
import { PredictionPlatformIcon } from '@/components/Prediction/PredictionPlatformIcon.js';

export function PredictionEventOverview() {
    const { event: detail, isActive } = use(PredictionContext);

    if (!detail) return null;

    const isCrypto = !!detail.cryptoData?.name;
    const isMultipleSeries = !!detail.series?.length && detail.markets.length > 1;

    return (
        <div className="flex items-start gap-4 p-4">
            {detail.image ? (
                <PredictionEventImage
                    platform={detail.platform}
                    alt={detail.title}
                    src={detail.image}
                    width={52}
                    height={52}
                />
            ) : null}
            <div className="min-w-0 flex-1">
                <h1 className="text-main text-xl font-semibold leading-6">{detail.title}</h1>
                <div className="mt-3 flex items-center gap-1.5">
                    <PredictionPlatformIcon platform={detail.platform} size={20} />
                    {!isCrypto || isMultipleSeries ? (
                        <span
                            className={classNames(
                                'h-5 rounded-full px-1.5 text-xs font-medium leading-5',
                                isActive
                                    ? isMultipleSeries
                                        ? 'bg-warn/10 text-warn'
                                        : 'bg-success/10 text-success'
                                    : 'bg-secondaryMain text-white',
                            )}
                        >
                            {isActive ? (
                                isMultipleSeries ? (
                                    <Trans>Live</Trans>
                                ) : (
                                    <Trans>Active</Trans>
                                )
                            ) : (
                                <Trans>Ended</Trans>
                            )}
                        </span>
                    ) : null}
                    <div className="text-second flex items-center gap-1">
                        <TimeIcon width={12} height={12} />
                        {isCrypto && detail.startTime && detail.endDate ? (
                            <PredictionEventTimeRange startTime={detail.startTime} endDate={detail.endDate} />
                        ) : detail.endTime ? (
                            <PredictionEventEndTime endTime={detail.endTime} />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
