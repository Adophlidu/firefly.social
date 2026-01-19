import { classNames } from '@dimensiondev/utils';
import dayjs from 'dayjs';
import { first, isUndefined } from 'lodash-es';
import { type TooltipProps } from 'recharts';

import { toFixedTrimmed } from '@/helpers/polymarket.js';
import type { BetsMarketWithSettings } from '@/types/prediction.js';

export function ChartTooltip(markets: BetsMarketWithSettings[], outcomeId: string) {
    return function Content({ active, payload }: TooltipProps<string, string>) {
        const isVisible = !!active && !!payload?.length;
        const time = first(payload)?.payload?.time
            ? dayjs(first(payload)?.payload?.time * 1000).format('MMM D, YYYY h:mmA')
            : null;

        return (
            <div className={classNames(isVisible ? 'visible' : 'invisible')}>
                {isVisible ? (
                    <div>
                        {time ? <span className="text-xs text-second">{time}</span> : null}
                        <div className="space-y-2">
                            {payload.map((data) => {
                                const market = markets.find(
                                    (m) => m.questionId === data.dataKey || m.id === data.dataKey,
                                );
                                if (!market || isUndefined(data.value)) return null;

                                const outcome = first(markets)?.outcomes.find((o) => o.id === outcomeId);
                                const tooltipLabel = markets.length === 1 ? outcome?.label : market.title;

                                return (
                                    <div key={data.dataKey} className="">
                                        <div
                                            className={classNames(
                                                'inline-flex h-7 max-w-[80vw] items-center gap-1 rounded px-2 text-sm text-white md:max-w-[400px]',
                                            )}
                                            style={{
                                                backgroundColor: markets.length === 1 ? outcome?.color : data.color,
                                            }}
                                        >
                                            <span className="min-w-0 flex-1 truncate">{tooltipLabel || '-'}</span>
                                            <span className="shrink-0">
                                                {toFixedTrimmed(+(data.value || 0) * 100, 2)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };
}
