import { memo, useLayoutEffect } from 'react';

import { Indicator, type IndicatorProps } from '@/components/EmbedCards/Indicator.js';
import type { DomainCardProps } from '@/components/EmbedCards/types.js';
import { WalletCard } from '@/components/EmbedCards/WalletCard.js';
import { useEnsAddress } from '@/hooks/useEnsAddress.js';

export const DomainCard = memo<DomainCardProps>(function DomainCard({ domain, ...rest }) {
    const { data: address } = useEnsAddress(domain);
    if (!address) return null;

    return <WalletCard address={address} domain={domain} {...rest} />;
});

interface DomainCardIndicatorProps extends IndicatorProps, Pick<DomainCardProps, 'domain'> {
    data: string;
    onAvailableUpdate: (data: string, available: boolean) => void;
}

export const DomainCardIndicator = memo<DomainCardIndicatorProps>(function DomainCardIndicator({
    domain,
    data,
    onAvailableUpdate,
    ...rest
}) {
    const { data: address } = useEnsAddress(domain);
    const unavailable = !address;

    useLayoutEffect(() => {
        onAvailableUpdate(data, !unavailable);
    }, [data, unavailable, onAvailableUpdate]);

    if (unavailable) return null;

    return <Indicator {...rest} />;
});
