import { Source } from '@dimensiondev/enums';

import { formatFireflyAccountProfileFromFireflyConnections } from '@/helpers/formatFireflyAccountProfileFromFireflyConnections.js';
import { formatWalletConnections } from '@/helpers/formatWalletConnection.js';
import { getAllConnections } from '@/providers/firefly/endpoint/getAllConnections.js';

export async function getAllConnectionsFormatted() {
    const connections = await getAllConnections();

    return {
        fireflyAccount: formatFireflyAccountProfileFromFireflyConnections(connections.account),
        social: {
            [Source.Bsky]: connections.bsky,
            [Source.Lens]: connections.lens,
            [Source.Farcaster]: connections.farcaster,
            [Source.Twitter]: connections.twitter,
        },
        evmConnections: formatWalletConnections(
            [
                ...connections.wallet.connectedEVM.map((x) => ({ ...x, isConnected: true })),
                ...connections.wallet.unconnectedEVM.map((x) => ({ ...x, isConnected: false })),
            ],
            connections,
        ),
        solanaConnections: formatWalletConnections(
            [
                ...connections.wallet.connectedSolana.map((x) => ({ ...x, isConnected: true })),
                ...connections.wallet.unconnectedSolana.map((x) => ({ ...x, isConnected: false })),
            ],
            connections,
        ),
        connected: formatWalletConnections(connections.wallet.connected, connections),
        related: formatWalletConnections(connections.wallet.unconnected, connections),
        __origin__: connections,
    };
}
