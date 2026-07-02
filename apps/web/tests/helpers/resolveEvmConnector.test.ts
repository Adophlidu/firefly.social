import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Config, Connector } from 'wagmi';

import { PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { resolveEvmConnector } from '@/helpers/resolveEvmConnector.js';

// PrivyConnector pulls in iframe-bridge + stores; stub it to keep the test hermetic.
vi.mock('@/connectors/PrivyConnector.js', () => ({
    PRIVY_CONNECTOR_ID: 'network.privy',
}));

const mockGetConnection = vi.fn();
const mockGetConnections = vi.fn();
const mockGetWagmiCurrentConnectionId = vi.fn();

vi.mock('wagmi/actions', () => ({
    getConnection: (...args: unknown[]) => mockGetConnection(...args),
    getConnections: (...args: unknown[]) => mockGetConnections(...args),
}));

vi.mock('@/helpers/getWagmiCurrentConnectionId.js', () => ({
    getWagmiCurrentConnectionId: () => mockGetWagmiCurrentConnectionId(),
}));

// Canonical, live connector source — mirrors wagmiConfig.connectors. The same
// refs are placed here AND in the mocked connections so canonical resolution is
// identity (existing assertions use reference equality).
const connectors: Connector[] = [];
const config = { connectors } as unknown as Config;

function connector(id: string, uid = id): Connector {
    return { id, uid } as unknown as Connector;
}

function connection(conn: Connector) {
    return { connector: conn };
}

describe('resolveEvmConnector', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        connectors.length = 0;
        mockGetWagmiCurrentConnectionId.mockReturnValue(undefined);
        mockGetConnection.mockReturnValue({ connector: undefined });
        mockGetConnections.mockReturnValue([]);
    });

    test('returns the connector matching the most-recent connection uid', () => {
        const metamask = connector('io.metamask', 'uid-mm');
        const rainbow = connector('me.rainbow', 'uid-rb');
        connectors.push(metamask, rainbow);
        mockGetWagmiCurrentConnectionId.mockReturnValue('uid-mm');
        mockGetConnections.mockReturnValue([connection(rainbow), connection(metamask)]);

        expect(resolveEvmConnector(config)).toBe(metamask);
    });

    test('matches by connector id as well as uid', () => {
        const metamask = connector('io.metamask', 'uid-mm');
        connectors.push(metamask);
        mockGetWagmiCurrentConnectionId.mockReturnValue('io.metamask');
        mockGetConnections.mockReturnValue([connection(metamask)]);

        expect(resolveEvmConnector(config)).toBe(metamask);
    });

    test('falls back to the active account connector when no recent-id match', () => {
        const active = connector('io.metamask');
        connectors.push(active);
        mockGetWagmiCurrentConnectionId.mockReturnValue('nonexistent');
        mockGetConnections.mockReturnValue([]);
        mockGetConnection.mockReturnValue({ connector: active });

        expect(resolveEvmConnector(config)).toBe(active);
    });

    test('falls back to the active account connector when there is no recent id at all', () => {
        const active = connector('io.metamask');
        connectors.push(active);
        mockGetConnections.mockReturnValue([]);
        mockGetConnection.mockReturnValue({ connector: active });

        expect(resolveEvmConnector(config)).toBe(active);
    });

    test('skips the active connector when it is Privy and returns the first non-Privy connection', () => {
        const privy = connector(PRIVY_CONNECTOR_ID);
        const metamask = connector('io.metamask');
        connectors.push(privy, metamask);
        mockGetConnection.mockReturnValue({ connector: privy });
        mockGetConnections.mockReturnValue([connection(privy), connection(metamask)]);

        expect(resolveEvmConnector(config)).toBe(metamask);
    });

    test('returns undefined when there are no non-Privy connections', () => {
        const privy = connector(PRIVY_CONNECTOR_ID);
        connectors.push(privy);
        mockGetConnection.mockReturnValue({ connector: privy });
        mockGetConnections.mockReturnValue([connection(privy)]);

        expect(resolveEvmConnector(config)).toBeUndefined();
    });

    test('skips a Privy connector matched by recent-id and falls back to non-Privy', () => {
        const privy = connector(PRIVY_CONNECTOR_ID);
        const metamask = connector('io.metamask');
        connectors.push(privy, metamask);
        mockGetWagmiCurrentConnectionId.mockReturnValue(PRIVY_CONNECTOR_ID);
        mockGetConnections.mockReturnValue([connection(privy), connection(metamask)]);

        expect(resolveEvmConnector(config)).toBe(metamask);
    });

    test('re-resolves a stale connection ref to the canonical connector from config.connectors', () => {
        // The connection holds a stale snapshot; config.connectors holds the live,
        // functional connector with the same id. canonical() must return the
        // canonical instance (the one exposing getProvider()) — not the stale ref.
        const canonicalMetaMask = connector('io.metamask', 'uid-canonical');
        const staleMetaMask = connector('io.metamask', 'uid-stale');
        connectors.push(canonicalMetaMask);
        mockGetConnection.mockReturnValue({ connector: staleMetaMask });
        mockGetConnections.mockReturnValue([connection(staleMetaMask)]);

        expect(resolveEvmConnector(config)).toBe(canonicalMetaMask);
    });

    test('returns a connection connector unchanged when no canonical instance is registered', () => {
        // A connector ref on a wagmi Connection whose id is absent from
        // config.connectors — canonical()'s `?? connector` fallback must return it
        // as-is rather than throwing or returning undefined.
        const stale = connector('io.metamask', 'uid-stale');
        mockGetConnection.mockReturnValue({ connector: stale });
        mockGetConnections.mockReturnValue([connection(stale)]);

        expect(resolveEvmConnector(config)).toBe(stale);
    });
});
