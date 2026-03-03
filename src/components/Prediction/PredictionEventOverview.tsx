import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';

import TimeIcon from '@/assets/time.svg';
import { PredictionEventEndTime } from '@/components/Prediction/PredictionEventEndTime.js';
import { PredictionEventImage } from '@/components/Prediction/PredictionEventImage.js';
import { PredictionPlatformIcon } from '@/components/Prediction/PredictionPlatformIcon.js';
import { type BetsEventDataForUI } from '@/types/prediction.js';

interface PredictionEventOverviewProps {
    detail: BetsEventDataForUI;
    isActive: boolean;
}

export function PredictionEventOverview({ detail, isActive }: PredictionEventOverviewProps) {
    return (
        <div className="flex items-start gap-4 p-4">
            {detail.image ? (
                <PredictionEventImage
                    platform={detail.platform}
                    alt={detail.title}
                    src={detail.image}
                    width={52}
                    height={52}
                    className="size-[52px] rounded-lg object-cover"
                />
            ) : null}
            <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold leading-6 text-main">{detail.title}</h1>
                <div className="mt-3 flex items-center gap-1.5">
                    <PredictionPlatformIcon platform={detail.platform} size={20} />
                    <span
                        className={classNames(
                            'h-5 rounded-full px-1.5 text-xs font-medium leading-5',
                            isActive ? 'bg-success/10 text-success' : 'bg-secondaryMain text-white',
                        )}
                    >
                        {isActive ? <Trans>Active</Trans> : <Trans>Ended</Trans>}
                    </span>
                    <div className="flex items-center gap-1 text-second">
                        <TimeIcon width={12} height={12} />
                        {detail.endTime ? <PredictionEventEndTime endTime={detail.endTime} /> : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
