import { type ConnectedWallet } from '@privy-io/react-auth';

import { chains } from '@/configs/chains.js';
import { config } from '@/configs/wagmi.js';

type SwapEvmConnector = (typeof config.connectors)[number];

function getPrivyWagmiConnectorId(wallet: ConnectedWallet): string {
    return wallet.walletClientType === 'privy' ? `${wallet.meta.id}.${wallet.address}` : wallet.meta.id;
}

export async function resolveSwapEvmConnector(wallet: ConnectedWallet): Promise<SwapEvmConnector | null> {
    const connectorId = getPrivyWagmiConnectorId(wallet);

    for (const connector of config.connectors) {
        if (connector.id !== connectorId) continue;
        const accounts = await connector.getAccounts().catch(() => []);
        if (accounts.some((account) => account.toLowerCase() === wallet.address.toLowerCase())) {
            return connector;
        }
    }

    return null;
}

export async function switchSwapEvmConnectorChain(
    wallet: {
        address: string;
        connector: SwapEvmConnector;
    },
    chainId: number,
) {
    const currentChainId = await wallet.connector.getChainId();
    if (currentChainId === chainId) return;
    if (!wallet.connector.switchChain) {
        throw new Error('Selected EVM wallet does not support chain switching');
    }

    const chain = chains.find((item) => item.id === chainId);

    await wallet.connector.switchChain({
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
