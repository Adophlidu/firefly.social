import { CoreChainController } from '@reown/appkit';
import { useLocation } from '@tanstack/react-router';
import { last } from 'lodash-es';
import { memo, useEffect, useState } from 'react';

import { getNetworkTypeFromCaipAddress } from '@/helpers/getNetworkTypeFromCaipAddress.js';
import { isPrivyAddress } from '@/helpers/isPrivyAddress.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { captureConnectWalletEvent } from '@/providers/telemetry/captureConnectWalletEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

export default memo(function ConnectingView() {
    const [now] = useState(Date.now());
    const location = useLocation();
    const { origin } = WalletConnectContext.useContainer();

    useEffect(
        () =>
            CoreChainController.subscribeKey('activeCaipAddress', (address) => {
                if (!address || isPrivyAddress(last(address.split(':')) || '')) return;

                const networkType = getNetworkTypeFromCaipAddress(address);
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
