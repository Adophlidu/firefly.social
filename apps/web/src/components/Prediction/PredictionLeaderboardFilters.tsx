'use client';

import { classNames } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { memo, useMemo } from 'react';

import { ClickableButton } from '@/components/ClickableButton.js';
import { PolymarketRankOrder, PolymarketRankPeriod } from '@/constants/enum.js';

interface PredictionLeaderboardFiltersProps {
    period: PolymarketRankPeriod;
    order: PolymarketRankOrder;
    onPeriodChange: (period: PolymarketRankPeriod) => void;
    onOrderChange: (order: PolymarketRankOrder) => void;
    isGlobal: boolean;
}

export const PredictionLeaderboardFilters = memo<PredictionLeaderboardFiltersProps>(
    function PredictionLeaderboardFilters({ period, order, onPeriodChange, onOrderChange, isGlobal }) {
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
                    { value: PolymarketRankOrder.Pnl, label: <Trans>Profit/Loss</Trans>, width: 'w-[120px]' },
                    !isGlobal
                        ? { value: PolymarketRankOrder.PnlRate, label: <Trans>PnL%</Trans>, width: 'w-[80px]' }
                        : null,
                    { value: PolymarketRankOrder.Volume, label: <Trans>Volume</Trans>, width: 'w-[100px]' },
                ]),
            [isGlobal],
        );

        return (
            <div className="flex items-center gap-2">
                <div className="border-lightLine2 flex shrink-0 items-center gap-0 rounded-md border">
                    {PERIODS.map((p, index) => (
                        <ClickableButton
                            key={p.value}
                            onClick={() => onPeriodChange(p.value)}
                            className={classNames('px-2 py-1.5 text-xs capitalize leading-4 transition-colors', {
                                'bg-lightBg text-lightMain py-[6px] font-semibold': period === p.value,
                                'text-second font-medium': period !== p.value,
                                'rounded-l-md': index === 0,
                                'rounded-r-md': index === PERIODS.length - 1,
                                'border-lightLine2 border-l': index > 0,
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
                            'text-second flex shrink-0 items-center justify-end gap-1 px-0 py-1 text-xs font-semibold capitalize leading-4 transition-colors',
                            o.width,
                            {
                                'text-lightMain': o.value === PolymarketRankOrder.Pnl,
                            },
                        )}
                    >
                        <span
                            className={classNames(
                                'text-xs transition-transform',
                                order === o.value ? 'rotate-180' : '',
                            )}
                        >
                            ▼
                        </span>
                        <span>{o.label}</span>
                    </ClickableButton>
                ))}
            </div>
        );
    },
);
