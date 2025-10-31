import { nativeBridgeProvider, Network, SupportedMethod } from '@dimensiondev/native-bridge';
import { useQuery } from '@tanstack/react-query';

import { EMPTY_LIST } from '@/constants/index.js';
import { useWalletConnections } from '@/hooks/useWalletConnections.js';

export function useActivityConnectedAddresses(type: Network = Network.All) {
    const connections = useWalletConnections();
    const query = useQuery({
        queryKey: ['activity-connected-address'],
        queryFn() {
            return nativeBridgeProvider.request(SupportedMethod.GET_WALLET_ADDRESS, {
                type,
            });
        },
        enabled: nativeBridgeProvider.supported,
    });
    return {
        ...query,
        addresses: (nativeBridgeProvider.supported ? query.data : connections.map((x) => x.address)) ?? EMPTY_LIST,
    };
}
