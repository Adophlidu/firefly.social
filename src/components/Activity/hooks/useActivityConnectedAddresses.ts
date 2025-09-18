import { useQuery } from '@tanstack/react-query';

import { EMPTY_LIST } from '@/constants/index.js';
import { useWalletConnections } from '@/hooks/useWalletConnections.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { Network, SupportedMethod } from '@/types/bridge.js';

export function useActivityConnectedAddresses(type: Network = Network.All) {
    const connections = useWalletConnections();
    const query = useQuery({
        queryKey: ['activity-connected-address'],
        queryFn() {
            return fireflyBridgeProvider.request(SupportedMethod.GET_WALLET_ADDRESS, {
                type,
            });
        },
        enabled: fireflyBridgeProvider.supported,
    });
    return {
        ...query,
        addresses: (fireflyBridgeProvider.supported ? query.data : connections.map((x) => x.address)) ?? EMPTY_LIST,
    };
}
