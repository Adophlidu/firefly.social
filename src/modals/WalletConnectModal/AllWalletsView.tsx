import { CoreConnectorController } from '@reown/appkit';
import { memo, useEffect } from 'react';

import { selectWallet } from '@/modals/WalletConnectModal/selectWallet.js';

export default memo(function AllWalletsView() {
    useEffect(() => {
        const original = CoreConnectorController.selectWalletConnector;
        CoreConnectorController.selectWalletConnector = selectWallet;
        return () => {
            CoreConnectorController.selectWalletConnector = original;
        };
    }, []);

    return <w3m-all-wallets-view />;
});
