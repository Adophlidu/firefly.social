import { CoreChainController, CoreRouterController } from '@reown/appkit';
import { useEffect } from 'react';
import urlcat from 'urlcat';

import { ConnectModalRef } from '@/modals/controls.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';

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

export function ConnectingWcView() {
    useEffect(() => {
        const unsubscribe = CoreChainController.subscribeKey('activeCaipAddress', (address) => {
            if (address) {
                ConnectModalRef.close();
            }
        });
        const unsubscribeRouter = rewriteAppKitRouter();

        return () => {
            unsubscribe();
            unsubscribeRouter();
        };
    }, []);

    return <w3m-connecting-wc-view />;
}
