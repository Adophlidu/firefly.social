import { atom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

import { hashString } from '@/helpers/hashString.js';
import { parseJwtExpiration } from '@/helpers/parseJwtExpiration.js';

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

// Store the current Privy token
const privyTokenAtom = atom<string | null>(null);

// Derive the hash from the current token
export const jwtHashAtom = atom((get) => {
    const token = get(privyTokenAtom);
    if (!token) return null;
    return hashString(token);
});

// Set the Privy token (call this when Privy becomes ready)
export const setPrivyTokenAtom = atom(null, (_get, set, token: string | null) => {
    set(privyTokenAtom, token);
});

// Get the current valid cache (checks expiration)
export const currentWalletCacheAtom = atom((get) => {
    const hash = get(jwtHashAtom);
    if (!hash) return null;

    const storage = get(walletAddressCacheStorageAtom);
    const cache = storage[hash];

    if (!cache) return null;

    // Check if cache is expired
    if (Date.now() >= cache.expiresAt) return null;

    return cache;
});

// Derived atoms for individual addresses
export const cachedEvmAddressAtom = atom((get) => {
    const cache = get(currentWalletCacheAtom);
    return cache?.evmAddress ?? null;
});

export const cachedSolanaAddressAtom = atom((get) => {
    const cache = get(currentWalletCacheAtom);
    return cache?.solanaAddress ?? null;
});

// Save wallet addresses to cache
export const saveWalletCacheAtom = atom(
    null,
    (get, set, params: { evmAddress: string; solanaAddress: string; token: string }) => {
        const { evmAddress, solanaAddress, token } = params;
        const hash = hashString(token);
        const expiresAt = parseJwtExpiration(token);

        if (!expiresAt) return;

        const storage = get(walletAddressCacheStorageAtom);
        set(walletAddressCacheStorageAtom, {
            ...storage,
            [hash]: {
                evmAddress,
                solanaAddress,
                expiresAt,
            },
        });
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

// Get cache by token directly (for initial load before atom is set)
export function getWalletCacheByToken(token: string): WalletAddressCache | null {
    if (typeof window === 'undefined') return null;

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const storage = JSON.parse(stored) as WalletAddressCacheStorage;
        const hash = hashString(token);
        const cache = storage[hash];

        if (!cache) return null;
        if (Date.now() >= cache.expiresAt) return null;

        return cache;
    } catch {
        return null;
    }
}

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
