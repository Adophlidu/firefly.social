import type { ConnectedWallet } from '@privy-io/react-auth';

import { config } from '@/configs/wagmi.js';

function getPrivyWagmiConnectorId(wallet: ConnectedWallet): string {
    return wallet.walletClientType === 'privy' ? `${wallet.meta.id}.${wallet.address}` : wallet.meta.id;
}

export async function resolveEvmConnector(wallet: ConnectedWallet) {
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
