import { chains } from '@dimensiondev/web3/chains';

import { config } from '@/configs/wagmiClient.js';

type EvmConnector = (typeof config.connectors)[number];

export async function resolveEvmConnector(address: string, connectorId?: string) {
    for (const connector of config.connectors) {
        if (connectorId && connector.id !== connectorId) continue;
        const accounts = await connector.getAccounts().catch(() => []);
        if (accounts.some((account) => account.toLowerCase() === address.toLowerCase())) {
            return connector;
        }
    }

    return null;
}

export async function switchEvmConnectorChain(connector: EvmConnector, chainId: number) {
    const currentChainId = await connector.getChainId();
    if (currentChainId === chainId) return;
    if (!connector.switchChain) {
        throw new Error('Selected EVM wallet does not support chain switching');
    }

    const chain = chains.find((item) => item.id === chainId);

    await connector.switchChain({
        chainId,
        addEthereumChainParameter: chain
            ? {
                  chainName: chain.name,
                  nativeCurrency: chain.nativeCurrency,
                  rpcUrls: chain.rpcUrls.default.http,
                  blockExplorerUrls: chain.blockExplorers?.default.url ? [chain.blockExplorers.default.url] : [],
              }
            : undefined,
    });
}
