'use client';

import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { getTradedMarketsCount } from '@/providers/polymarket/getTradedMarketsCount.js';

interface PolymarketMarketsTradedProps {
    address: string;
    proxyAddress?: string;
    enabled?: boolean;
}

export const PolymarketMarketsTraded = memo<PolymarketMarketsTradedProps>(function PolymarketMarketsTraded({
    address,
    proxyAddress,
    enabled = true,
}) {
    const { data, isLoading } = useQuery({
        queryKey: ['polymarket', 'markets-traded', address.toLowerCase()],
        enabled,
        staleTime: 1000 * 60 * 5,
        queryFn: () => getTradedMarketsCount(proxyAddress || address),
    });

    if (isLoading) return <LoadingIcon size={20} />;

    return formatPolymarketNumber(data?.traded, { prefix: null });
});
