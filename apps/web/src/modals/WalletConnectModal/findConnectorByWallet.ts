import { CoreChainController, CoreConnectorController } from '@reown/appkit';

export function findConnectorByWallet(wallet: { id: string; rdns?: string | null }) {
    const namespace = CoreChainController.state.activeChain;
    if (!namespace) return;

    return CoreConnectorController.getConnector({ id: wallet.id, namespace });
}
