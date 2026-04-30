import { getNetworkTypeFromCaipAddress } from '@dimensiondev/web3/utils';
import { CoreChainController, CoreRouterController } from '@reown/appkit';
import { useLocation } from '@tanstack/react-router';
import { last } from 'lodash-es';
import { memo, useEffect } from 'react';
import urlcat from 'urlcat';

import { isPrivyAddress } from '@/helpers/isPrivyAddress.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/refs.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';
import { captureConnectWalletEvent } from '@/providers/telemetry/captureConnectWalletEvent.js';
import { EventId } from '@/providers/types/Telemetry.js';

function rewriteAppKitRouter() {
    const original = CoreRouterController.push;
    CoreRouterController.push = (path, ...rest) => {
        const wallet = rest[0]?.wallet;
        if (path === 'Downloads' && wallet) {
            CoreRouterController.state.data = { wallet };
            walletRouter.navigate({ to: urlcat('/download', { name: encodeURIComponent(wallet.name || '') }) });
        } else {
            original.call(CoreRouterController, path, ...rest);
        }
    };

    return () => {
        CoreRouterController.push = original;
    };
}

export default memo(function ConnectingWcView() {
    const location = useLocation();
    const { origin } = WalletConnectContext.useContainer();

    useEffect(() => {
        const unsubscribe = CoreChainController.subscribeKey('activeCaipAddress', (address) => {
            if (!address || isPrivyAddress(last(address.split(':')) || '')) return;

            const networkType = getNetworkTypeFromCaipAddress(address);
            WalletConnectModalRef.close(networkType ? { networkType } : undefined);
            captureConnectWalletEvent(EventId.CONNECT_WALLET_SUCCESS, {
                name: location.search.name,
                origin,
                address,
                connect_time: location.search.now,
                connect_success_time: Date.now(),
            });
        });
        const unsubscribeRouter = rewriteAppKitRouter();

        return () => {
            unsubscribe();
            unsubscribeRouter();
        };
    }, [location, origin]);

    return <w3m-connecting-wc-view />;
});
