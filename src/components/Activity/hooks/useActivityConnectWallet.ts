import { useCallback } from 'react';

import { useActivityConnectedAddresses } from '@/components/Activity/hooks/useActivityConnectedAddresses.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { Network, SupportedMethod } from '@/types/bridge.js';

export function useActivityConnectWallet() {
    const connectedAddresses = useActivityConnectedAddresses();
    return useCallback(async () => {
        if (fireflyBridgeProvider.supported) {
            const address = await fireflyBridgeProvider.request(SupportedMethod.CONNECT_WALLET, {
                type: Network.All,
            });
            await connectedAddresses.refetch();
            return address;
        }
        await WalletConnectModalRef.openAndWaitForClose();
        return;
    }, [connectedAddresses]);
}
