import { CoreConnectionController, CoreConnectorController } from '@reown/appkit';

import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { privySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { logger } from '@/libs/Logger.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';

let reconnectPrivyWalletTask: Promise<void> | null = null;

async function reconnectPrivyWalletInternal() {
    const { isAuthorized, isConnected } = useFireflyWalletStore.getState();
    if (!isAuthorized || isConnected) return;

    logger.info('[privy] reconnect privy wallet');

    // Reconnect EVM wallet
    const currentEvmId = CoreConnectorController.getConnectorId('eip155');
    if (!currentEvmId || currentEvmId === PRIVY_CONNECTOR_ID) {
        const connectors = CoreConnectorController.state.connectors;
        const privyConnector = connectors.find((c) => c.id === PRIVY_CONNECTOR_ID);
        const evmConnector = privyConnector?.connectors?.find((c) => c.chain === 'eip155');
        if (evmConnector) {
            await runInSafeAsync(() => CoreConnectionController.connectExternal(evmConnector, 'eip155'));
            logger.info('[privy] reconnect privy evm wallet successful');
        }
    }

    // Reconnect Solana wallet
    const currentSolanaId = CoreConnectorController.getConnectorId('solana');
    if (!currentSolanaId || currentSolanaId === PRIVY_CONNECTOR_ID) {
        await CoreConnectionController.connectExternal(privySolanaProvider, privySolanaProvider.chain);
        logger.info('[privy] reconnect privy solana wallet successful');
    }

    useFireflyWalletStore.getState().setIsConnected(true);
}

export async function reconnectPrivyWallet() {
    if (reconnectPrivyWalletTask) return reconnectPrivyWalletTask;

    reconnectPrivyWalletTask = (async () => {
        try {
            await reconnectPrivyWalletInternal();
        } catch (error) {
            logger.error('[privy] reconnect privy wallet failed', error);
        } finally {
            reconnectPrivyWalletTask = null;
        }
    })();

    return reconnectPrivyWalletTask;
}
