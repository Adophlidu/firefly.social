import { describe, expect, it } from 'vitest';

import { hasPersistedWalletSession } from '@/helpers/hasPersistedWalletSession.js';

function createStorage(entries: Record<string, string>): Pick<Storage, 'getItem'> {
    return {
        getItem: (key: string) => (key in entries ? entries[key] : null),
    };
}

describe('hasPersistedWalletSession', () => {
    it('returns false without storage', () => {
        expect(hasPersistedWalletSession(null)).toBe(false);
    });

    it('returns false for empty storage', () => {
        expect(hasPersistedWalletSession(createStorage({}))).toBe(false);
    });

    it('detects a recently used wagmi connector', () => {
        expect(hasPersistedWalletSession(createStorage({ 'wagmi.recentConnectorId': '"io.metamask"' }))).toBe(true);
    });

    it('detects a connected AppKit session', () => {
        expect(hasPersistedWalletSession(createStorage({ '@appkit/connection_status': 'connected' }))).toBe(true);
    });

    it('ignores a disconnected AppKit session', () => {
        expect(hasPersistedWalletSession(createStorage({ '@appkit/connection_status': 'disconnected' }))).toBe(false);
    });

    it('detects a current wagmi connection', () => {
        const store = JSON.stringify({ state: { current: 'abc123', chainId: 1 }, version: 2 });
        expect(hasPersistedWalletSession(createStorage({ 'wagmi.store': store }))).toBe(true);
    });

    it('ignores a wagmi store without a current connection', () => {
        const store = JSON.stringify({ state: { current: null, chainId: 1 }, version: 2 });
        expect(hasPersistedWalletSession(createStorage({ 'wagmi.store': store }))).toBe(false);
    });

    it('detects a persisted Firefly profile session', () => {
        const store = JSON.stringify({ state: { currentProfileSession: { type: 'Firefly' } }, version: 0 });
        expect(hasPersistedWalletSession(createStorage({ 'firefly-state': store }))).toBe(true);
    });

    it('ignores a Firefly profile store without a session', () => {
        const store = JSON.stringify({ state: { currentProfileSession: null }, version: 0 });
        expect(hasPersistedWalletSession(createStorage({ 'firefly-state': store }))).toBe(false);
    });

    it('tolerates corrupted JSON payloads', () => {
        expect(hasPersistedWalletSession(createStorage({ 'wagmi.store': '{oops', 'firefly-state': 'not-json' }))).toBe(
            false,
        );
    });

    it('tolerates storage that throws', () => {
        const storage: Pick<Storage, 'getItem'> = {
            getItem: () => {
                throw new Error('denied');
            },
        };
        expect(hasPersistedWalletSession(storage)).toBe(false);
    });
});
