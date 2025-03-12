import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { ContractCard } from '@/components/EmbedCards/ContractCard.js';
import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { WalletCard } from '@/components/EmbedCards/WalletCard.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export const AddressCard = memo<AddressCardProps>(function AddressCard(props) {
    const address = props.address;
    const { data: detected } = useQuery({
        queryKey: ['detect-address', address],
        queryFn: () => FireflyEndpointProvider.detectAddress(address),
        select: (data) => data.list[0],
    });
    const address_type = detected?.address_type;
    if (!address_type) return null;

    switch (address_type) {
        case 'eoa':
        case 'soa':
            return <WalletCard {...props} />;
        case 'contract':
            if (detected.contract_type === 'program') return null;
            return <ContractCard contractType={detected.contract_type} chainId={+detected.chain_id} {...props} />;
        default:
            safeUnreachable(address_type);
            return null;
    }
});
