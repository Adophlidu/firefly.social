import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
import { isSameEthereumAddress } from '@/helpers/isSameAddress.js';
import { getVolumeTraded } from '@/providers/polymarket/getVolumeTraded.js';

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
        staleTime: 1000 * 60 * 5,
        queryFn: () => getVolumeTraded(proxyAddress || address),
        select(data) {
            return data.find((x) => isSameEthereumAddress(x.proxyWallet, address))?.amount;
        },
    });

    if (isLoading) return <span className="inline-block h-3 w-16 animate-pulse rounded-sm bg-third" />;
    if (!data) return '';
    return data > 1 ? Math.floor(data) : formatPolymarketNumber(data, { prefix: '' });
});
