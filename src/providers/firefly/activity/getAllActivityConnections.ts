import { STATUS, WalletSource } from '@/constants/enum.js';
import { env } from '@/constants/env.js';
import { formatWalletConnections } from '@/helpers/formatWalletConnection.js';
import { getAllConnections } from '@/providers/firefly/endpoint/getAllConnections.js';

export async function getAllActivityConnections() {
    const connections = await getAllConnections();

    if (env.external.NEXT_PUBLIC_ACTIVITY_PARTICLE === STATUS.Disabled) {
        connections.wallet.connected = connections.wallet.connected.filter((x) => x.source !== WalletSource.Particle);
    }

    return {
        connected: formatWalletConnections(connections.wallet.connected, connections),
        related: formatWalletConnections(connections.wallet.unconnected, connections),
        rawConnections: connections,
    };
}
