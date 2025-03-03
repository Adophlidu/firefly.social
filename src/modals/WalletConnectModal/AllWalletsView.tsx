import { CoreConnectorController } from '@reown/appkit';
import { useEffect } from 'react';

import { selectWallet } from '@/modals/WalletConnectModal/selectWallet.js';

export function AllWalletsView() {
    useEffect(() => {
        const original = CoreConnectorController.selectWalletConnector;
        CoreConnectorController.selectWalletConnector = selectWallet;
        return () => {
            CoreConnectorController.selectWalletConnector = original;
        };
    }, []);

    return <w3m-all-wallets-view />;
}
