import { classNames } from '@dimensiondev/utils';

import { bedStead } from '@/fonts/bedStead/index.js';
import { isZero } from '@/helpers/number.js';
import { computeVolume, toFixedTrimmed } from '@/helpers/polymarket.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';

interface ActivityRateProps {
    activity: BetsActivity;
}

export function BetsActivityRate({ activity }: ActivityRateProps) {
    const isZeroPrice = activity.conditionOutcomePrices.every((price) => isZero(price));

    return (
        <div className="mt-3">
            <div className="flex items-center gap-1">
                {activity.conditionOutcomes.map((outcome, index) => {
                    const price = activity.conditionOutcomePrices[index] || '0';
                    const rate = toFixedTrimmed(+price * 100, 2);
                    const isLast = index === activity.conditionOutcomes.length - 1;

                    return (
                        <div
                            key={outcome}
                            style={{
                                flex: isZeroPrice ? 1 : price,
                            }}
                            className={isLast ? 'text-right text-danger' : 'text-left text-success'}
                        >
                            <div className="w-full whitespace-nowrap text-sm">
                                <span className={`font-bold ${bedStead.className}`}>{outcome}</span>
                                <span className="ml-1 font-semibold">{rate}¢</span>
                            </div>
                            {isZeroPrice ? null : (
                                <div className={classNames('mt-1 h-1 w-full', isLast ? 'bg-danger' : 'bg-success')} />
                            )}
                            <div className="mt-3 w-full text-[13px] text-second">${computeVolume(activity, index)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
