import { classNames } from '@/helpers/classNames.js';
import { computeVolume, toFixedTrimmed } from '@/helpers/polymarket.js';
import type { PolymarketActivity } from '@/providers/types/Firefly.js';

interface ActivityRateProps {
    activity: PolymarketActivity;
}

export function PolymarketActivityRate({ activity }: ActivityRateProps) {
    return (
        <>
            <div className="mt-2 flex h-12 gap-x-2 overflow-hidden rounded-full">
                {activity.conditionOutcomes.map((outcome, index) => {
                    const rate = toFixedTrimmed((+activity.conditionOutcomePrices[index] || 0) * 100, 2);
                    const isFirst = index === 0;
                    const isLast = index === activity.conditionOutcomes.length - 1;

                    return (
                        <div
                            className={classNames('relative min-w-[86px]', {
                                'rounded-l-full': isFirst,
                                'rounded-r-full': isLast,
                            })}
                            style={{
                                width: `${rate}%`,
                                background: isFirst
                                    ? `linear-gradient(to right, ${isFirst ? 'var(--success-color)' : 'var(--danger-color)'}, ${isFirst ? 'var(--success-color)' : 'var(--danger-color)'} 20px, transparent 20px)`
                                    : isLast
                                      ? `linear-gradient(to left, ${isFirst ? 'var(--success-color)' : 'var(--danger-color)'}, ${isFirst ? 'var(--success-color)' : 'var(--danger-color)'} 20px, transparent 20px)`
                                      : 'transparent',
                            }}
                            key={outcome}
                        >
                            <div
                                className={classNames('h-full skew-x-[-30deg] rounded-lg', {
                                    'bg-[var(--success-color)]': isFirst,
                                    'bg-[var(--danger-color)]': !isFirst,
                                })}
                            />
                            <div
                                className={classNames(
                                    'absolute inset-y-0 flex max-w-full flex-col justify-center font-bold',
                                    {
                                        'right-0 pr-7 text-right': isLast,
                                        'left-0 pl-7': !isLast,
                                        'text-success': isFirst,
                                        'text-danger': !isFirst,
                                    },
                                )}
                            >
                                <span className="truncate text-xs uppercase">{outcome}</span>
                                <span className="text-sm">{rate}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-2 flex justify-between px-5 text-xs font-medium leading-[14px] text-second">
                {activity.conditionOutcomePrices.map((_, index) => {
                    const rate = toFixedTrimmed((+activity.conditionOutcomePrices[index] || 0) * 100, 2);

                    return (
                        <span
                            key={index}
                            className={classNames('min-w-[86px]', {
                                'text-right': index === activity.conditionOutcomePrices.length - 1,
                            })}
                            style={{ width: `${rate}%` }}
                        >
                            ${computeVolume(activity, index)}
                        </span>
                    );
                })}
            </div>
        </>
    );
}
