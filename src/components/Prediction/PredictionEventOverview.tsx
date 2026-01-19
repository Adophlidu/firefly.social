import TimeIcon from '@/assets/time.svg';
import { PredictionPlatformIcon } from '@/components/Prediction/PredictionPlatformIcon.js';
import { Image } from '@/esm/Image.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

interface PredictionEventOverviewProps {
    detail: BetsEventDataForUI;
}

export function PredictionEventOverview({ detail }: PredictionEventOverviewProps) {
    return (
        <div className="flex items-start gap-4 p-4">
            {detail.image ? (
                <Image
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
                    <div className="flex items-center gap-1 text-second">
                        <TimeIcon width={12} height={12} />
                        {detail.endTime ? (
                            <span className="text-xs">
                                {new Date(detail.endTime).toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
