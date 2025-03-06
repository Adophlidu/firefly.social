import { safeUnreachable } from '@masknet/kit';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';

import type { AddressCardProps } from '@/components/EmbedCards/types.js';
import { WalletCard } from '@/components/EmbedCards/WalletCard.js';
import { TokenCard } from '@/components/Token/TokenCard.js';
import { TokenContextProvider } from '@/components/Token/TokenContext.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export const AddressCard = memo<AddressCardProps>(function EvmAddressCard(props) {
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
            return (
                <TokenContextProvider>
                    <TokenCard {...props} />
                </TokenContextProvider>
            );
        default:
            safeUnreachable(address_type);
            return null;
    }
});
