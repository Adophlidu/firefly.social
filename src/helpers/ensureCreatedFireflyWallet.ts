import { queryClient } from '@/configs/queryClient.js';
import { WalletSource } from '@/constants/enum.js';
import { queryMyAllConnections } from '@/hooks/useAllConnections.js';
import { FireflyEndpointProvider } from '@/providers/firefly/Endpoint.js';

export async function ensureCreatedFireflyWallet() {
    const { connected } = await queryClient.fetchQuery(queryMyAllConnections);
    const privyConnections = connected.filter((connection) => connection.source === WalletSource.Privy);
    if (privyConnections.length >= 2) {
        return privyConnections;
    }
    await FireflyEndpointProvider.createPrivyWallet();
    const { connected: createdConnected } = await queryClient.fetchQuery(queryMyAllConnections);
    return createdConnected.filter((connection) => connection.source === WalletSource.Privy);
}
