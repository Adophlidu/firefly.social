import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { first } from 'lodash-es';
import { memo } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { formatPolymarketNumber } from '@/components/Polymarket/formatPolymarketNumber.js';
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
    });
    const volume = first(data)?.amount;

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-second">
                <Trans>Volume Traded</Trans>
            </span>
            <div className="text-sm font-semibold text-main">
                {isLoading ? <LoadingIcon size={20} /> : formatPolymarketNumber(volume)}
            </div>
        </div>
    );
});
