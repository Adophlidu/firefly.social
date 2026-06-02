import {
    ChainController as CoreChainController,
    ConnectorController as CoreConnectorController,
} from '@reown/appkit-controllers';

export function findConnectorByWallet(wallet: { id: string; rdns?: string | null }) {
    const namespace = CoreChainController.state.activeChain;
    if (!namespace) return;

    return CoreConnectorController.getConnector({ id: wallet.id, namespace });
}
