import { CoreConnectionController, CoreConnectorController } from '@reown/appkit';

import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { PrivySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { logger } from '@/libs/Logger.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';

export async function reconnectPrivyWallet() {
    try {
        const { isAuthorized, isConnected } = useFireflyWalletStore.getState();
        if (!isAuthorized || isConnected) return;

        logger.info('[privy] reconnect privy wallet');

        const currentSolanaId = CoreConnectorController.getConnectorId('solana');
        if (!currentSolanaId || currentSolanaId === PRIVY_CONNECTOR_ID) {
            await CoreConnectionController.connectExternal(PrivySolanaProvider, PrivySolanaProvider.chain);
            logger.info('[privy] reconnect privy wallet successful');
        }

        useFireflyWalletStore.getState().setIsConnected(true);
    } catch (error) {
        logger.error('[privy] reconnect privy wallet failed', error);
    }
}
