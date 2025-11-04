import { queryClient } from '@/configs/queryClient.js';
import { WalletSource } from '@/constants/enum.js';
import { queryMyAllConnections } from '@/hooks/useAllConnections.js';
import { createPrivyWallet } from '@/providers/firefly/endpoints/createPrivyWallet.js';

export async function ensureCreatedFireflyWallets() {
    const { connected } = await queryClient.fetchQuery(queryMyAllConnections);
    const privyConnections = connected.filter((connection) => connection.source === WalletSource.Privy);
    if (privyConnections.length >= 2) return privyConnections;
    await createPrivyWallet();
    const { connected: createdConnected } = await queryClient.fetchQuery(queryMyAllConnections);
    return createdConnected.filter((connection) => connection.source === WalletSource.Privy);
}

export async function ensureCreatedFireflyWallet(platform: 'eth' | 'solana' = 'eth') {
    const wallets = await ensureCreatedFireflyWallets();
    const wallet = wallets.find((x) => x.platform === platform);
    return wallet;
}
