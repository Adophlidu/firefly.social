import { CoreChainController, CoreStorageUtil } from '@reown/appkit';
import { disconnect } from 'wagmi/actions';

import { config } from '@/configs/wagmiClient.js';
import type { ChainNamespace } from '@/types/index.js';

const originalDisconnect = CoreChainController.disconnect;

export function rewriteDisconnectMethod(namespace: ChainNamespace) {
    CoreChainController.disconnect = async function disconnectChain() {
        const chains = CoreChainController.state.chains;
        const connectedChains = Array.from(chains.values()).filter(
            (x) => x.accountState?.status === 'connected' && x.accountState.address,
        );
        const adapter = chains.get(namespace);
        if (connectedChains.length <= 1 || !adapter) {
            await originalDisconnect.call(CoreChainController);
            return;
        }
        await adapter.connectionControllerClient?.disconnect();
        if (namespace === 'eip155') {
            await disconnect(config);
        } else {
            CoreChainController.resetAccount(namespace);
            CoreChainController.resetNetwork(namespace);
            CoreStorageUtil.deleteConnectedConnectorId(namespace);
        }
    };
}

export function restoreDisconnectMethod() {
    CoreChainController.disconnect = originalDisconnect;
}
