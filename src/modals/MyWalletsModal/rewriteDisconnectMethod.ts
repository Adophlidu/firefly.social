import { CoreChainController, CoreStorageUtil } from '@reown/appkit';
import { disconnect, getAccount, getChainId, getConnections } from 'wagmi/actions';

import { appkit } from '@/configs/appkit.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { switchNetwork } from '@/modals/MyWalletsModal/switchNetwork.js';
import type { ChainNamespace } from '@/types/utility.js';

const originalDisconnect = CoreChainController.disconnect;
const pendingNamespace = new Set<ChainNamespace>();

export function rewriteDisconnectMethod(namespace: ChainNamespace, connectorId?: string) {
    CoreChainController.disconnect = async function disconnectChain() {
        try {
            if (pendingNamespace.has(namespace)) return;
            pendingNamespace.add(namespace);

            const chains = CoreChainController.state.chains;
            const adapter = chains.get(namespace);
            const connections = getConnections(wagmiConfig);
            const connectedChains = Array.from(chains.values()).filter(
                (x) => x.accountState?.status === 'connected' && x.accountState.address,
            );

            // only one connection, disconnect directly
            if (
                (namespace === 'eip155' && connections.length <= 1 && connectedChains.length <= 1) ||
                (namespace !== 'eip155' && connectedChains.length <= 1)
            ) {
                await originalDisconnect.call(CoreChainController);
                pendingNamespace.delete(namespace);
                return;
            }

            // for evm, disconnect the specified connector and recover the next connected chain
            if (namespace === 'eip155') {
                const connector = connections.find((x) => x.connector.id === connectorId)?.connector;
                await disconnect(wagmiConfig, {
                    connector,
                });
                const address = getAccount(wagmiConfig)?.address;
                const chainId = getChainId(wagmiConfig);
                if (address && chainId) {
                    appkit.setCaipAddress(`eip155:${chainId}:${address}`, namespace);
                    pendingNamespace.delete(namespace);
                    return;
                }
            }

            // One evm and one solana: reset the disconnected namespace
            await adapter?.connectionControllerClient?.disconnect();
            CoreChainController.resetAccount(namespace);
            CoreChainController.resetNetwork(namespace);
            CoreStorageUtil.deleteConnectedConnectorId(namespace);
            pendingNamespace.delete(namespace);

            // Recover the connected chain: such as disconnect evm, recover solana
            const connected = Array.from(CoreChainController.state.chains.entries()).find(
                ([, adapter]) => adapter.accountState?.status === 'connected',
            );
            if (!connected) return;
            appkit.setStatus('connected', connected[0]);
            const chainId = getChainId(wagmiConfig);
            await switchNetwork(connected[0], chainId);
        } catch (error) {
            pendingNamespace.delete(namespace);
            throw error;
        }
    };
}

export function restoreDisconnectMethod() {
    CoreChainController.disconnect = originalDisconnect;
    pendingNamespace.clear();
}
