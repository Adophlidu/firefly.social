import { SessionType } from '@dimensiondev/enums';
import { bom, parseJson } from '@dimensiondev/utils';

import { resolveProfileStorageKeyBySessionType } from '@/helpers/resolveProfileStorageKey.js';

interface PersistedWagmiStore {
    state?: {
        /** The uid of the current connector; null / absent when disconnected. */
        current?: string | null;
    };
}

interface PersistedProfileStore {
    state?: {
        currentProfileSession?: unknown;
    };
}

/**
 * Synchronously detect whether the visitor already has a wallet/web3 session
 * persisted from a previous visit, so the deferred wallet stack can be
 * activated at boot and logged-in users see no behavior change.
 *
 * Checks (fail-open: any hit activates the stack, a false positive only costs
 * an unnecessary chunk load):
 * - `wagmi.store` / `wagmi.recentConnectorId` — wagmi EVM connections.
 * - `@appkit/connection_status` — AppKit connections (covers Solana wallets).
 * - the persisted Firefly profile store — any logged-in Firefly user (Privy
 *   embedded wallets resume from the Firefly session, and logged-in users need
 *   the FireflyWallet dock and wallet-backed flows).
 */
export function hasPersistedWalletSession(storage: Pick<Storage, 'getItem'> | null = bom.localStorage): boolean {
    if (!storage) return false;

    try {
        if (storage.getItem('wagmi.recentConnectorId')) return true;
        if (storage.getItem('@appkit/connection_status') === 'connected') return true;

        const wagmiStore = parseJson<PersistedWagmiStore>(storage.getItem('wagmi.store'));
        if (wagmiStore?.state?.current) return true;

        const profileStore = parseJson<PersistedProfileStore>(
            storage.getItem(resolveProfileStorageKeyBySessionType(SessionType.Firefly)),
        );
        if (profileStore?.state?.currentProfileSession) return true;
    } catch {
        // Storage access can throw (e.g. privacy mode); treat as no session.
    }

    return false;
}
