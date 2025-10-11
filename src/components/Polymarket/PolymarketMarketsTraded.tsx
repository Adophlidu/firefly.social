'use client';

import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { type HTMLProps, memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { classNames } from '@/helpers/classNames.js';
import { PolymarketDataApi } from '@/providers/polymarket/DataApi.js';

interface PolymarketMarketsTradedProps extends HTMLProps<HTMLDivElement> {
    address: string;
    proxyAddress?: string;
    enabled?: boolean;
}

export const PolymarketMarketsTraded = memo<PolymarketMarketsTradedProps>(function PolymarketMarketsTraded({
    address,
    proxyAddress,
    enabled = true,
    className,
}) {
    const { data, isLoading } = useQuery({
        queryKey: ['polymarket', 'markets-traded', address],
        enabled,
        staleTime: 1000 * 60 * 5,
        queryFn: () => PolymarketDataApi.getTradedMarketsCount(proxyAddress || address),
    });

    return (
        <div className={classNames('flex flex-col gap-1', className)}>
            <span className="text-xs text-second">
                <Trans>Markets Traded</Trans>
            </span>
            <div className="text-sm font-semibold text-main">
                {isLoading ? <LoadingIcon size={20} /> : formatPolymarketNumber(data?.traded, { prefix: null })}
            </div>
        </div>
    );
});
