import { nativeBridgeProvider, Network, SupportedMethod } from '@dimensiondev/native-bridge';
import { useCallback } from 'react';

import { useActivityConnectedAddresses } from '@/components/Activity/hooks/useActivityConnectedAddresses.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';

export function useActivityConnectWallet() {
    const connectedAddresses = useActivityConnectedAddresses();
    return useCallback(async () => {
        if (nativeBridgeProvider.supported) {
            const address = await nativeBridgeProvider.request(SupportedMethod.CONNECT_WALLET, {
                type: Network.All,
            });
            await connectedAddresses.refetch();
            return address;
        }
        await WalletConnectModalRef.openAndWaitForClose();
        return;
    }, [connectedAddresses]);
}
