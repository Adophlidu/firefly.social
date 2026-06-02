import { getNetworkTypeFromCaipAddress, isSameAddress } from '@dimensiondev/web3/utils';
import {
    ChainController as CoreChainController,
    RouterController as CoreRouterController,
} from '@reown/appkit-controllers';
import { useLocation } from '@tanstack/react-router';
import { last } from 'lodash-es';
import { memo, useCallback, useEffect, useRef } from 'react';
import urlcat from 'urlcat';

import { isPrivyAddress } from '@/helpers/isPrivyAddress.js';
import { closeWalletConnectModal } from '@/helpers/openWalletConnectModal.js';
import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
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
    const completedRef = useRef(false);
    const initialAddressRef = useRef(CoreChainController.state.activeCaipAddress);

    const handleConnectedAddress = useCallback(
        (address?: string) => {
            if (completedRef.current || !address || isPrivyAddress(last(address.split(':')) || '')) return;
            if (isSameAddress(address, initialAddressRef.current)) return;

            completedRef.current = true;
            const networkType = getNetworkTypeFromCaipAddress(address);
            closeWalletConnectModal(networkType ? { networkType } : undefined);
            captureConnectWalletEvent(EventId.CONNECT_WALLET_SUCCESS, {
                name: location.search.name,
                origin,
                address,
                connect_time: location.search.now,
                connect_success_time: Date.now(),
            });
        },
        [location.search.name, location.search.now, origin],
    );

    useEffect(() => {
        const onResume = () => handleConnectedAddress(CoreChainController.state.activeCaipAddress);
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') onResume();
        };

        const unsubscribe = CoreChainController.subscribeKey('activeCaipAddress', handleConnectedAddress);
        const unsubscribeRouter = rewriteAppKitRouter();
        onResume();

        window.addEventListener('focus', onResume);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            unsubscribe();
            unsubscribeRouter();
            window.removeEventListener('focus', onResume);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [handleConnectedAddress]);

    return <w3m-connecting-wc-view />;
});
