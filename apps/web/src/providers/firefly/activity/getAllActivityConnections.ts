import { STATUS, WalletSource } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';

import { formatWalletConnections } from '@/helpers/formatWalletConnection.js';
import { getAllConnections } from '@/providers/firefly/endpoint/getAllConnections.js';

export async function getAllActivityConnections() {
    const connections = await getAllConnections();

    if (envs.external.NEXT_PUBLIC_ACTIVITY_PARTICLE === STATUS.Disabled) {
        connections.wallet.connected = connections.wallet.connected.filter((x) => x.source !== WalletSource.Particle);
    }

    return {
        connected: formatWalletConnections(connections.wallet.connected, connections),
        related: formatWalletConnections(connections.wallet.unconnected, connections),
        rawConnections: connections,
    };
}
