import { NetworkType } from '@dimensiondev/enums';
import { getAddressType } from '@dimensiondev/web3/utils';

import { usePrivyConnections } from '@/hooks/usePrivyConnections.js';

export function usePrivyAddresses() {
    const { connections, isLoading } = usePrivyConnections();

    const privyEvm = connections.find((x) => getAddressType(x.address) === NetworkType.Ethereum);
    const privySolana = connections.find((x) => getAddressType(x.address) === NetworkType.Solana);

    return {
        evm: privyEvm?.address ?? null,
        solana: privySolana?.address ?? null,
        isLoading,
    };
}
