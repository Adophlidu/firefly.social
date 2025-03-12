import { memo } from 'react';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { useEnsAddress } from 'wagmi';

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
