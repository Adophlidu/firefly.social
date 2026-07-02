import { getNetworkTypeFromCaipAddress, isSameAddress } from '@dimensiondev/web3/utils';
import { ChainController as CoreChainController } from '@reown/appkit-controllers';
import { useLocation } from '@tanstack/react-router';
import { last } from 'lodash-es';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useConnection } from 'wagmi';
import { reconnect } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { closeWalletConnectModal } from '@/controllers/openWalletConnectModal.js';
import { isPrivyAddress } from '@/helpers/isPrivyAddress.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import { captureConnectWalletEvent } from '@/providers/telemetry/captureConnectWalletEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

export default memo(function ConnectingView() {
    const [now] = useState(Date.now());
    const location = useLocation();
    const { origin, onConnectRef } = WalletConnectContext.useContainer();
    const wagmiAccount = useConnection();
    const wagmiConnectedRef = useRef(wagmiAccount.isConnected);
    const completedRef = useRef(false);
    const initialAddressRef = useRef(CoreChainController.state.activeCaipAddress);
    wagmiConnectedRef.current = wagmiAccount.isConnected;

    const handleConnectedAddress = useCallback(
        async (address?: string) => {
            if (completedRef.current || !address || isPrivyAddress(last(address.split(':')) || '')) return;
            if (isSameAddress(address, initialAddressRef.current)) return;

            completedRef.current = true;
            const networkType = getNetworkTypeFromCaipAddress(address);

            if (address.startsWith('eip155:') && !wagmiConnectedRef.current) {
                try {
                    await reconnect(wagmiConfig);
                } catch {
                    // reconnect may fail if no connectors have stored state
                }
            }

            // Run an optional callback while the wallet is still connected. The EVM
            // connection is torn down once the modal closes (MetaMask emits
            // accountsChanged([]) → wagmi disconnect), so any signing that needs the
            // live connection — e.g. binding the wallet — must happen before the close.
            const onConnect = onConnectRef.current;
            if (networkType && onConnect) {
                try {
                    await onConnect(networkType, address);
                } catch {
                    // callback errors are surfaced by the caller; never block the close
                }
            }

            closeWalletConnectModal(networkType ? { networkType } : undefined);
            captureConnectWalletEvent(EventId.CONNECT_WALLET_SUCCESS, {
                origin,
                name: location.search.name,
                address,
                connect_time: now,
                connect_success_time: Date.now(),
            });
        },
        [location.search.name, now, origin],
    );

    useEffect(() => {
        const onResume = () => handleConnectedAddress(CoreChainController.state.activeCaipAddress);
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') onResume();
        };

        const unsubscribe = CoreChainController.subscribeKey('activeCaipAddress', handleConnectedAddress);
        onResume();

        window.addEventListener('focus', onResume);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            unsubscribe();
            window.removeEventListener('focus', onResume);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [handleConnectedAddress]);

    return <w3m-connecting-external-view />;
});
