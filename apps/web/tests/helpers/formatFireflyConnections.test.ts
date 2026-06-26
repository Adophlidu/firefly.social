import { describe, expect, test } from 'vitest';

import { formatFireflyConnections } from '@/helpers/formatFireflyConnections.js';
import type { FireflyConnection, GetAllConnectionsResponse, LensConnection } from '@/providers/types/Firefly.js';

function createLensConnection(localName: string): LensConnection {
    return {
        id: `0x${localName}`,
        ownedBy: '0xowner',
        nameSpace: 'lens',
        localName,
        fullHandle: `lens/${localName}`,
    };
}

function createAccount(uid: string): FireflyConnection {
    return {
        account_id: { high: 0, low: 0 },
        id: uid,
        name: 'firefly',
        platform: 'firefly',
        connected: true,
        uid,
    };
}

function createResponse(options: {
    account: FireflyConnection[];
    connectedLens: LensConnection[];
    unconnectedLens?: LensConnection[];
}): GetAllConnectionsResponse {
    const emptyRecord = { connected: [], unconnected: [] };
    return {
        code: 200,
        data: {
            account: options.account,
            farcaster: { connected: [], unconnected: [] },
            lens: {
                connected: [{ address: '0xowner', lens: options.connectedLens }],
                unconnected: [{ address: '0xowner', lens: options.unconnectedLens ?? [] }],
            },
            bsky: { connected: [], unconnected: [] },
            wallet: {
                connected: [],
                unconnected: [],
                connectedEVM: [],
                connectedSolana: [],
                unconnectedSolana: [],
                unconnectedEVM: [],
            },
            google: emptyRecord,
            telegram: emptyRecord,
            apple: emptyRecord,
            email: emptyRecord,
            twitter: { connected: [], unconnected: [] },
        },
    };
}

describe('formatFireflyConnections', () => {
    test('excludes the auto-registered Lens account (handle `ff-<uid>`) from connections', () => {
        const response = createResponse({
            account: [createAccount('12345')],
            connectedLens: [createLensConnection('ff-12345'), createLensConnection('alice')],
        });

        const result = formatFireflyConnections(response);
        const handles = result.lens.connected.flatMap((group) => group.lens.map((x) => x.localName));

        expect(handles).toEqual(['alice']);
    });

    test('drops the address group when only the auto-registered account remains', () => {
        const response = createResponse({
            account: [createAccount('12345')],
            connectedLens: [createLensConnection('ff-12345')],
        });

        const result = formatFireflyConnections(response);

        expect(result.lens.connected).toEqual([]);
    });

    test('matches the auto-registered handle case-insensitively', () => {
        const response = createResponse({
            account: [createAccount('12345')],
            connectedLens: [createLensConnection('FF-12345'), createLensConnection('bob')],
        });

        const result = formatFireflyConnections(response);
        const handles = result.lens.connected.flatMap((group) => group.lens.map((x) => x.localName));

        expect(handles).toEqual(['bob']);
    });

    test('also filters the auto-registered account from the unconnected list', () => {
        const response = createResponse({
            account: [createAccount('12345')],
            connectedLens: [],
            unconnectedLens: [createLensConnection('ff-12345'), createLensConnection('carol')],
        });

        const result = formatFireflyConnections(response);
        const handles = result.lens.unconnected.flatMap((group) => group.lens.map((x) => x.localName));

        expect(handles).toEqual(['carol']);
    });

    test('keeps every Lens account when there is no firefly uid', () => {
        const response = createResponse({
            account: [],
            connectedLens: [createLensConnection('ff-12345'), createLensConnection('dave')],
        });

        const result = formatFireflyConnections(response);
        const handles = result.lens.connected.flatMap((group) => group.lens.map((x) => x.localName));

        expect(handles).toEqual(['ff-12345', 'dave']);
    });
});
