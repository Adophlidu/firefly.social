import { CoreChainController, CoreStorageUtil } from '@reown/appkit';
import { disconnect, getAccount, getChainId, getConnections } from 'wagmi/actions';

import { appkit, config } from '@/configs/wagmiClient.js';
import type { ChainNamespace } from '@/types/index.js';

const originalDisconnect = CoreChainController.disconnect;

export function rewriteDisconnectMethod(namespace: ChainNamespace, connectorId?: string) {
    CoreChainController.disconnect = async function disconnectChain() {
        const chains = CoreChainController.state.chains;
        const adapter = chains.get(namespace);
        const connections = getConnections(config);
        const connectedChains = Array.from(chains.values()).filter(
            (x) => x.accountState?.status === 'connected' && x.accountState.address,
        );

        if (
            (namespace === 'eip155' && connections.length <= 1 && connectedChains.length <= 1) ||
            (namespace !== 'eip155' && connectedChains.length <= 1)
        ) {
            await originalDisconnect.call(CoreChainController);
            return;
        }

        if (namespace === 'eip155') {
            const connector = connections.find((x) => x.connector.id === connectorId)?.connector;
            await disconnect(config, {
                connector,
            });
            const address = getAccount(config)?.address;
            const chainId = getChainId(config);
            if (address && chainId) {
                appkit.setCaipAddress(`eip155:${chainId}:${address}`, namespace);
                return;
            }
        }
        await adapter?.connectionControllerClient?.disconnect();
        CoreChainController.resetAccount(namespace);
        CoreChainController.resetNetwork(namespace);
        CoreStorageUtil.deleteConnectedConnectorId(namespace);
    };
}

export function restoreDisconnectMethod() {
    CoreChainController.disconnect = originalDisconnect;
}
