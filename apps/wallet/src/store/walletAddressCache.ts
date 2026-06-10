import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

export interface WalletAddressCache {
    evmAddress: string;
    solanaAddress: string;
    expiresAt: number;
}

export interface WalletAddressCacheStorage {
    [jwtHash: string]: WalletAddressCache;
}

const STORAGE_KEY = 'wallet-address-cache';

const walletAddressCacheStorageAtom = atomWithStorage<WalletAddressCacheStorage>(
    STORAGE_KEY,
    {},
    typeof window !== 'undefined' ? createJSONStorage(() => window.localStorage) : undefined,
    {
        getOnInit: true,
    },
);

// Clear expired caches
export const clearExpiredCachesAtom = atom(null, (get, set) => {
    const storage = get(walletAddressCacheStorageAtom);
    const now = Date.now();

    const newStorage: WalletAddressCacheStorage = {};
    let hasChanges = false;

    for (const [hash, cache] of Object.entries(storage)) {
        if (cache.expiresAt > now) {
            newStorage[hash] = cache;
        } else {
            hasChanges = true;
        }
    }

    if (hasChanges) {
        set(walletAddressCacheStorageAtom, newStorage);
    }
});

// Get the latest valid cache from localStorage (without needing token)
// Returns the cache with the latest expiration time that hasn't expired yet
export function getLatestValidWalletCache(): WalletAddressCache | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const storage = JSON.parse(stored) as WalletAddressCacheStorage;
        const now = Date.now();

        let latestCache: WalletAddressCache | null = null;
        let latestExpiry = 0;

        for (const cache of Object.values(storage)) {
            // Skip expired caches
            if (cache.expiresAt <= now) continue;

            // Keep the one with the latest expiry (most recently created)
            if (cache.expiresAt > latestExpiry) {
                latestExpiry = cache.expiresAt;
                latestCache = cache;
            }
        }

        return latestCache;
    } catch {
        return null;
    }
}
