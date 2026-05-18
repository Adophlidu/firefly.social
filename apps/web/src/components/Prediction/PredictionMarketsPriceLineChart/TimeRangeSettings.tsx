'use client';

import { PredictionPlatform } from '@dimensiondev/enums';
import { classNames, safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { memo, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { BetsPriceTimeRange } from '@/constants/enum.js';

interface TimeRangeSettingsProps {
    platform: PredictionPlatform;
    timeRange: BetsPriceTimeRange;
    onTimeRangeChange: (timeRange: BetsPriceTimeRange) => void;
}

function TimeRangeLabel({ timeRange }: { timeRange: BetsPriceTimeRange }) {
    switch (timeRange) {
        case BetsPriceTimeRange.OneHour:
            return <Trans>1H</Trans>;
        case BetsPriceTimeRange.SixHours:
            return <Trans>6H</Trans>;
        case BetsPriceTimeRange.OneDay:
            return <Trans>1D</Trans>;
        case BetsPriceTimeRange.OneWeek:
            return <Trans>1W</Trans>;
        case BetsPriceTimeRange.OneMonth:
            return <Trans>1M</Trans>;
        case BetsPriceTimeRange.All:
            return <Trans>ALL</Trans>;
        default:
            safeUnreachable(timeRange);
            return null;
    }
}

export const TimeRangeSettings = memo<TimeRangeSettingsProps>(function TimeRangeSettings({
    platform,
    timeRange,
    onTimeRangeChange,
}) {
    const timeRanges = useMemo(
        () =>
            platform === PredictionPlatform.Polymarket
                ? [
                      BetsPriceTimeRange.OneHour,
                      BetsPriceTimeRange.SixHours,
                      BetsPriceTimeRange.OneDay,
                      BetsPriceTimeRange.OneWeek,
                      BetsPriceTimeRange.OneMonth,
                      BetsPriceTimeRange.All,
                  ]
                : [
                      BetsPriceTimeRange.OneDay,
                      BetsPriceTimeRange.OneWeek,
                      BetsPriceTimeRange.OneMonth,
                      BetsPriceTimeRange.All,
                  ],
        [platform],
    );

    return (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
            {timeRanges.map((range) => (
                <ClickableButton
                    key={range}
                    className={classNames(
                        'hover:text-highlight h-[18px] rounded px-1.5 text-xs !leading-[18px]',
                        range === timeRange
                            ? 'bg-highlight/20 text-highlight font-semibold'
                            : 'text-main bg-transparent',
                    )}
                    onClick={() => {
                        if (range === timeRange) return;
                        onTimeRangeChange(range);
                    }}
                >
                    <TimeRangeLabel timeRange={range} />
                </ClickableButton>
            ))}
        </div>
    );
});
