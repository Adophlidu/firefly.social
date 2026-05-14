import { memo } from 'react';

import type { KlineInterval } from '@/components/PerpKlineChart/types.js';
import { cn } from '@/lib/utils.js';

const INTERVALS: readonly KlineInterval[] = ['1m', '15m', '1h', '4h', 'D'];

export interface PerpKlineIntervalPillsProps {
    value: KlineInterval;
    onChange: (interval: KlineInterval) => void;
}

export const PerpKlineIntervalPills = memo<PerpKlineIntervalPillsProps>(function PerpKlineIntervalPills({
    value,
    onChange,
}) {
    return (
        <div className="flex items-center">
            {INTERVALS.map((interval) => {
                const active = interval === value;
                return (
                    <button
                        key={interval}
                        type="button"
                        className="inline-flex h-9 min-w-[44px] items-center justify-center px-1.5 active:opacity-75"
                        onClick={() => onChange(interval)}
                    >
                        <span
                            className={cn(
                                'text-[13px] font-medium leading-[17px]',
                                active ? 'text-main' : 'text-deactivate',
                            )}
                        >
                            {interval}
                        </span>
                    </button>
                );
            })}
        </div>
    );
});
