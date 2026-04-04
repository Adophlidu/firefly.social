import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { STALE_TIMES } from '@/constants/query.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { getVolumeTraded } from '@/providers/prediction/polymarket/getVolumeTraded.js';

interface PolymarketVolumeTradedProps {
    address: string;
    proxyAddress?: string;
}

export const PolymarketVolumeTraded = memo<PolymarketVolumeTradedProps>(function PolymarketVolumeTraded({
    address,
    proxyAddress,
}) {
    const { data, isLoading } = useQuery({
        queryKey: ['polymarket', 'volume-traded', address.toLowerCase()],
        staleTime: STALE_TIMES.MINUTE_5,
        queryFn: () => getVolumeTraded(proxyAddress || address),
        select(data) {
            return data.find((x) => isSameEthereumAddress(x.proxyWallet, address))?.amount;
        },
    });

    if (isLoading) return <span className="bg-third inline-block h-3 w-16 animate-pulse rounded-sm" />;
    if (!data) return '0';
    return formatPolymarketNumber(data, { symbol: '' });
});
