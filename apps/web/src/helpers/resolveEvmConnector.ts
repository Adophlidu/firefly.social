import type { Config, Connector } from 'wagmi';
import { getConnection, getConnections } from 'wagmi/actions';

import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { getWagmiCurrentConnectionId } from '@/helpers/getWagmiCurrentConnectionId.js';

// Re-resolve through config.connectors (as AppKit's WagmiAdapter does): the
// ref on a Connection right after reconnect() can be a stale snapshot.
function canonical(config: Config, connector: Connector | undefined): Connector | undefined {
    if (!connector) return undefined;
    return config.connectors.find((c) => c.id === connector.id) ?? connector;
}

/**
 * Resolve the wagmi connector to use for an EVM action, in priority order:
 *   1. the connector matching the most-recent connection id (wagmi.store "current")
 *   2. the active account's connector
 *   3. the first non-Privy connection (Privy is the embedded wallet, not a bindable external wallet)
 *
 * AppKit/Reown connections don't reliably populate wagmi's notion of the "current"
 * connector, so callers must resolve the target explicitly and pass `{ connector }`
 * to wagmi actions — otherwise `ConnectorNotConnectedError` is thrown.
 */
export function resolveEvmConnector(config: Config): Connector | undefined {
    const recentConnectionId = getWagmiCurrentConnectionId();

    const connections = getConnections(config);

    let targetConnector = canonical(
        config,
        connections.find(
            (conn) => conn.connector.id === recentConnectionId || conn.connector.uid === recentConnectionId,
        )?.connector,
    );

    if (!targetConnector) {
        // getConnection is the non-deprecated name for getAccount both expose
        // the active connector.
        targetConnector = canonical(config, getConnection(config).connector);
    }

    // fallback to first non-privy
    if (!targetConnector || targetConnector.id === PRIVY_CONNECTOR_ID) {
        targetConnector = canonical(
            config,
            connections.find((conn) => conn.connector.id !== PRIVY_CONNECTOR_ID)?.connector,
        );
    }

    return targetConnector;
}
