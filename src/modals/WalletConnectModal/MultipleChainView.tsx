import { CoreRouterController } from '@reown/appkit';
import { useEffect } from 'react';
import urlcat from 'urlcat';

import { walletRouter } from '@/modals/WalletConnectModal/routes.js';

function rewriteAppKitRouter() {
    const original = CoreRouterController.push;
    CoreRouterController.push = function (path, ...rest) {
        switch (path) {
            case 'AllWallets':
                walletRouter.navigate({ to: '/all-wallets' });
                break;
            case 'ConnectingWalletConnect':
                walletRouter.navigate({ to: '/connecting-wc' });
                break;
            case 'ConnectingExternal':
                CoreRouterController.state.data = { connector: rest[0]?.connector };
                walletRouter.navigate({
                    to: urlcat('/connecting', {
                        name: encodeURIComponent(rest[0]?.connector?.name || ''),
                    }),
                });
                break;
            default:
                original.call(CoreRouterController, path, ...rest);
                break;
        }
    };

    return () => {
        CoreRouterController.push = original;
    };
}

export function MultipleChainView() {
    useEffect(rewriteAppKitRouter, []);

    return <w3m-connecting-multi-chain-view />;
}
