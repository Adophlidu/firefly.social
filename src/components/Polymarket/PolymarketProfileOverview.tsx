'use client';

import { Trans } from '@lingui/react/macro';
import { compact } from 'lodash-es';
import { useMemo } from 'react';

import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { PolymarketMarketsTraded } from '@/components/Polymarket/PolymarketMarketsTraded.js';
import { PolymarketVolumeTraded } from '@/components/Polymarket/PolymarketVolumeTraded.js';
import { ToggleVisibleBox } from '@/components/Polymarket/ToggleVisibleBox.js';
import { formatPrice } from '@/helpers/formatPrice.js';
import type { PolymarketProfileData } from '@/providers/types/Firefly.js';

interface PolymarketProfileOverviewProps {
    data?: PolymarketProfileData;
    address: string;
}

function toRate(num?: number | null) {
    if (num === undefined || num === null) return '-';

    return `${num < 0 ? '-' : ''}${(Math.abs(num) * 100).toFixed(2)}%`;
}

export function PolymarketProfileOverview({ data, address }: PolymarketProfileOverviewProps) {
    const dataConfig = useMemo(() => {
        return [
            {
                label: <Trans>Polymarket PnL</Trans>,
                value: (
                    <span className={!data ? '' : data.pnl < 0 ? 'text-danger' : 'text-success'}>
                        {formatPolymarketNumber(data?.pnl, { symbol: true })}
                    </span>
                ),
            },
            {
                label: <Trans>PnL%</Trans>,
                value: (
                    <span className={!data ? '-' : data.pnl_rate < 0 ? 'text-danger' : 'text-success'}>
                        {toRate(data?.pnl_rate)}
                    </span>
                ),
            },
            {
                label: <Trans>Total Gains</Trans>,
                value: (
                    <span>
                        {formatPolymarketNumber(data?.gains, {
                            symbol: true,
                        })}
                    </span>
                ),
            },
            {
                label: <Trans>Total Losses</Trans>,
                value: (
                    <span>
                        {formatPolymarketNumber(data?.losses, {
                            symbol: true,
                        })}
                    </span>
                ),
            },
            {
                label: <Trans>Total Value</Trans>,
                value: <span>{formatPolymarketNumber(data?.balance)}</span>,
            },
            {
                label: <Trans>Win Rate</Trans>,
                value: <span>{toRate(data?.win_rate)}</span>,
            },
            {
                label: <Trans>Current Positions</Trans>,
                value: <span>{formatPolymarketNumber(data?.notfill_balance)}</span>,
            },
            {
                label: <Trans>Balance</Trans>,
                value: <span>{!data ? '-' : `$${formatPrice(data.cash_balance)}`}</span>,
            },
            {
                label: <Trans>Volume Traded</Trans>,
                value: <PolymarketVolumeTraded key="volume-traded" address={address} proxyAddress={data?.proxy} />,
                custom: true,
            },
            {
                label: <Trans>Markets Traded</Trans>,
                value: <PolymarketMarketsTraded key="markets-traded" address={address} proxyAddress={data?.proxy} />,
                custom: true,
            },
        ];
    }, [address, data]);
    const tags = useMemo(() => compact([data?.win_rate67, data?.join1year]), [data?.join1year, data?.win_rate67]);

    return (
        <ToggleVisibleBox label={<Trans>Overview</Trans>}>
            <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-4">
                {dataConfig.map((item, i) =>
                    item.custom ? (
                        item.value
                    ) : (
                        <div key={i} className="flex flex-col gap-1">
                            <span className="text-xs text-second">{item.label}</span>
                            <div className="text-sm font-semibold text-main">{item.value ?? '-'}</div>
                        </div>
                    ),
                )}
            </div>
            {tags.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    {tags.map((tag, i) => (
                        <span
                            key={i}
                            className="h-[26px] rounded-full border border-line px-3 text-xs font-medium !leading-6 text-main"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            ) : null}
        </ToggleVisibleBox>
    );
}
