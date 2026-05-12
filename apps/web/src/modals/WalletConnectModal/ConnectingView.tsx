import { getNetworkTypeFromCaipAddress } from '@dimensiondev/web3/utils';
import { CoreChainController } from '@reown/appkit';
import { useLocation } from '@tanstack/react-router';
import { last } from 'lodash-es';
import { memo, useEffect, useRef, useState } from 'react';
import { useConnection } from 'wagmi';
import { reconnect } from 'wagmi/actions';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { isPrivyAddress } from '@/helpers/isPrivyAddress.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { captureConnectWalletEvent } from '@/providers/telemetry/captureConnectWalletEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

export default memo(function ConnectingView() {
    const [now] = useState(Date.now());
    const location = useLocation();
    const { origin } = WalletConnectContext.useContainer();
    const wagmiAccount = useConnection();
    const wagmiConnectedRef = useRef(wagmiAccount.isConnected);
    wagmiConnectedRef.current = wagmiAccount.isConnected;

    useEffect(
        () =>
            CoreChainController.subscribeKey('activeCaipAddress', async (address) => {
                if (!address || isPrivyAddress(last(address.split(':')) || '')) return;

                const networkType = getNetworkTypeFromCaipAddress(address);

                if (address.startsWith('eip155:') && !wagmiConnectedRef.current) {
                    try {
                        await reconnect(wagmiConfig);
                    } catch {
                        // reconnect may fail if no connectors have stored state
                    }
                }

                WalletConnectModalRef.close(networkType ? { networkType } : undefined);
                captureConnectWalletEvent(EventId.CONNECT_WALLET_SUCCESS, {
                    origin,
                    name: location.search.name,
                    address,
                    connect_time: now,
                    connect_success_time: Date.now(),
                });
            }),
        [location, now, origin],
    );

    return <w3m-connecting-external-view />;
});
