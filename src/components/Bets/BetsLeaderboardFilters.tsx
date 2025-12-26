'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PolymarketRankOrder, PolymarketRankPeriod } from '@/constants/enum.js';

interface BetsLeaderboardFiltersProps {
    period: PolymarketRankPeriod;
    order: PolymarketRankOrder;
    onPeriodChange: (period: PolymarketRankPeriod) => void;
    onOrderChange: (order: PolymarketRankOrder) => void;
    isGlobal: boolean;
}

export const BetsLeaderboardFilters = memo<BetsLeaderboardFiltersProps>(function BetsLeaderboardFilters({
    period,
    order,
    onPeriodChange,
    onOrderChange,
    isGlobal,
}) {
    const PERIODS = useMemo(
        () =>
            compact([
                { value: PolymarketRankPeriod.OneDay, label: <Trans>Today</Trans> },
                { value: PolymarketRankPeriod.OneWeek, label: <Trans>Week</Trans> },
                { value: PolymarketRankPeriod.OneMonth, label: <Trans>Month</Trans> },
                !isGlobal ? { value: PolymarketRankPeriod.OneYear, label: <Trans>Year</Trans> } : null,
                { value: PolymarketRankPeriod.All, label: <Trans>All</Trans> },
            ]),
        [isGlobal],
    );

    const ORDERS = useMemo(
        () =>
            compact([
                { value: PolymarketRankOrder.Pnl, label: <Trans>Profit/Loss</Trans> },
                !isGlobal ? { value: PolymarketRankOrder.PnlRate, label: <Trans>P&L Rate</Trans> } : null,
                { value: PolymarketRankOrder.Volume, label: <Trans>Volume</Trans> },
            ]),
        [isGlobal],
    );

    return (
        <div className="flex items-center gap-2">
            <div className="border-lightLine2 flex items-center overflow-hidden rounded-md">
                {PERIODS.map((p, index) => (
                    <ClickableButton
                        key={p.value}
                        onClick={() => onPeriodChange(p.value)}
                        className={classNames('px-2 py-1.5 text-xs capitalize leading-4 transition-colors', {
                            'border-0 bg-lightBg py-[7px] font-semibold text-lightMain': period === p.value,
                            'text-lightSecond border-lightLine2 border font-medium': period !== p.value,
                            'rounded-l-md': index === 0,
                            'rounded-r-md': index === PERIODS.length - 1,
                        })}
                    >
                        {p.label}
                    </ClickableButton>
                ))}
            </div>
            <div className="flex flex-1" />
            {ORDERS.map((o) => (
                <ClickableButton
                    key={o.value}
                    onClick={() => onOrderChange(o.value)}
                    className={classNames(
                        'flex w-[120px] items-center justify-end gap-1 px-0 py-1 text-xs font-semibold capitalize leading-4 transition-colors',
                        {
                            'text-lightMain': order === o.value,
                            'text-lightSecond': order !== o.value,
                        },
                    )}
                >
                    <span className={classNames('text-xs transition-transform', order === o.value ? 'rotate-180' : '')}>
                        ▼
                    </span>
                    <span>{o.label}</span>
                </ClickableButton>
            ))}
        </div>
    );
});
