import { CoreChainController } from '@reown/appkit';
import { useLocation } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { WalletConnectModalRef } from '@/modals/controls.js';
import { captureConnectWalletEvent } from '@/providers/telemetry/captureConnectWalletEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

export function ConnectingView() {
    const [now] = useState(Date.now());
    const location = useLocation();

    useEffect(
        () =>
            CoreChainController.subscribeKey('activeCaipAddress', (address) => {
                if (!address) return;

                WalletConnectModalRef.close();
                captureConnectWalletEvent(EventId.CONNECT_WALLET_SUCCESS, {
                    name: location.search.name,
                    address,
                    connect_time: now,
                    connect_success_time: Date.now(),
                });
            }),
        [location, now],
    );

    return <w3m-connecting-external-view />;
}
