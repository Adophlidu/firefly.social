import { memo, useLayoutEffect } from 'react';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { useEnsAddress } from 'wagmi';

import { Indicator, type IndicatorProps } from '@/components/EmbedCards/Indicator.js';
import type { DomainCardProps } from '@/components/EmbedCards/types.js';
import { WalletCard } from '@/components/EmbedCards/WalletCard.js';

export const DomainCard = memo<DomainCardProps>(function DomainCard({ domain, ...rest }) {
    const { data: address } = useEnsAddress({
        chainId: mainnet.id,
        name: normalize(domain),
    });

    if (!address) return null;

    return <WalletCard address={address} domain={domain} {...rest} />;
});

export interface DomainCardIndicatorProps extends IndicatorProps, Pick<DomainCardProps, 'domain'> {
    data: string;
    onAvailableUpdate: (data: string, available: boolean) => void;
}
export const DomainCardIndicator = memo<DomainCardIndicatorProps>(function DomainCardIndicator({
    domain,
    data,
    onAvailableUpdate,
    ...rest
}) {
    const { data: address } = useEnsAddress({
        chainId: mainnet.id,
        name: normalize(domain),
    });
    const unavailable = !address;

    useLayoutEffect(() => {
        onAvailableUpdate(data, !unavailable);
    }, [data, unavailable, onAvailableUpdate]);

    if (unavailable) return null;

    return <Indicator {...rest} />;
});
