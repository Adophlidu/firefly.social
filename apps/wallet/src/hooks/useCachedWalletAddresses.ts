import { type ConnectedWallet, usePrivy, useWallets as useEvmWallets } from '@privy-io/react-auth';
import type { ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';

import { accessPathAtom, SwapAccessPath } from '@/store/swap/swapState.js';
import {
    clearExpiredCachesAtom,
    getLatestValidWalletCache,
    saveWalletCacheAtom,
    setPrivyTokenAtom,
    type WalletAddressCache,
} from '@/store/walletAddressCache.js';

interface CachedWalletAddresses {
    evmAddress: string | null;
    solanaAddress: string | null;
    evmWalletName: string;
    solanaWalletName: string;
    isFromCache: boolean;
    isPrivyReady: boolean;
    isLoading: boolean;
}

// Read cache synchronously on module load (before any React render)
function getInitialCache(): WalletAddressCache | null {
    return getLatestValidWalletCache();
}

export function useCachedWalletAddresses(): CachedWalletAddresses {
    const privy = usePrivy();
    const { ready: evmReady, wallets: evmWallets } = useEvmWallets();
    const { ready: solanaReady, wallets: solanaWallets } = useSolanaWallets();

    const setPrivyToken = useSetAtom(setPrivyTokenAtom);
    const saveWalletCache = useSetAtom(saveWalletCacheAtom);
    const clearExpiredCaches = useSetAtom(clearExpiredCachesAtom);

    // Initialize cache from localStorage immediately (synchronously)
    const [initialCache] = useState<WalletAddressCache | null>(getInitialCache);
    const hasCleanedUp = useRef(false);

    // Clean up expired caches once on mount
    useEffect(() => {
        if (hasCleanedUp.current) return;
        hasCleanedUp.current = true;
        clearExpiredCaches();
    }, [clearExpiredCaches]);

    // Privy readiness check
    const isPrivyReady = evmReady && solanaReady && evmWallets.length > 0 && solanaWallets.length > 0;

    // Live addresses from Privy
    const liveEvmAddress = evmWallets?.[0]?.address ?? null;
    const liveSolanaAddress = solanaWallets?.[0]?.address ?? null;

    // Update cache when Privy becomes ready with wallet addresses
    useEffect(() => {
        if (!isPrivyReady || !liveEvmAddress || !liveSolanaAddress) return;

        const updateCache = async () => {
            try {
                const token = await privy.getAccessToken();
                if (token) {
                    setPrivyToken(token);
                    saveWalletCache({
                        evmAddress: liveEvmAddress,
                        solanaAddress: liveSolanaAddress,
                        token,
                    });
                }
            } catch {
                // Token fetch failed, skip cache update
            }
        };

        updateCache();
    }, [isPrivyReady, liveEvmAddress, liveSolanaAddress, privy, setPrivyToken, saveWalletCache]);

    // Wallet names from Privy
    const evmWalletName = evmWallets?.[0]?.walletClientType ?? 'Embedded';
    const solanaWalletName = solanaWallets?.[0]?.standardWallet?.name ?? 'Embedded';

    return useMemo(() => {
        // If Privy is ready, use live addresses
        if (isPrivyReady) {
            return {
                evmAddress: liveEvmAddress,
                solanaAddress: liveSolanaAddress,
                evmWalletName,
                solanaWalletName,
                isFromCache: false,
                isPrivyReady: true,
                isLoading: false,
            };
        }

        // Use cached addresses from localStorage (read on mount)
        const evmAddress = initialCache?.evmAddress ?? null;
        const solanaAddress = initialCache?.solanaAddress ?? null;
        const hasCache = evmAddress !== null && solanaAddress !== null;

        return {
            evmAddress,
            solanaAddress,
            evmWalletName,
            solanaWalletName,
            isFromCache: hasCache,
            isPrivyReady: false,
            isLoading: !hasCache,
        };
    }, [isPrivyReady, liveEvmAddress, liveSolanaAddress, initialCache, evmWalletName, solanaWalletName]);
}

export function useCachedEvmAddress(): string | null {
    const { evmAddress } = useCachedWalletAddresses();
    return evmAddress;
}

export function useCachedSolanaAddress(): string | null {
    const { solanaAddress } = useCachedWalletAddresses();
    return solanaAddress;
}

/**
 * Get specifically the embedded (Firefly) wallet addresses.
 * Unlike useCachedWalletAddresses, this always returns the embedded wallet,
 * not the currently "active" wallet which may be an external wallet.
 */
export function useEmbeddedWalletAddresses(): {
    evmAddress: string | null;
    solanaAddress: string | null;
    isPrivyReady: boolean;
    isLoading: boolean;
    evmWallet: ConnectedWallet | null;
    solanaWallet: ConnectedStandardSolanaWallet | null;
} {
    const { ready: evmReady, wallets: evmWallets } = useEvmWallets();
    const { ready: solanaReady, wallets: solanaWallets } = useSolanaWallets();

    const isPrivyReady = evmReady && solanaReady && evmWallets.length > 0 && solanaWallets.length > 0;

    // Find embedded wallets (walletClientType === 'privy' for EVM, isPrivyWallet for Solana)
    const embeddedEvmWallet = useMemo(() => evmWallets.find((w) => w.walletClientType === 'privy'), [evmWallets]);
    const embeddedSolanaWallet = useMemo(
        () => solanaWallets.find((w) => 'isPrivyWallet' in w.standardWallet && w.standardWallet.isPrivyWallet),
        [solanaWallets],
    );

    return {
        evmAddress: embeddedEvmWallet?.address ?? null,
        solanaAddress: embeddedSolanaWallet?.address ?? null,
        isPrivyReady,
        isLoading: !isPrivyReady,
        evmWallet: embeddedEvmWallet ?? null,
        solanaWallet: embeddedSolanaWallet ?? null,
    };
}

export function useEmbeddedEvmAddress(): string | null {
    const { evmAddress } = useEmbeddedWalletAddresses();
    return evmAddress;
}

export function useEmbeddedEvmWalletContext(): {
    address: string | null;
    wallet: ConnectedWallet | null;
    isReady: boolean;
    isLoading: boolean;
} {
    const { ready, wallets } = useEvmWallets();

    const wallet = useMemo(() => wallets.find((w) => w.walletClientType === 'privy') ?? null, [wallets]);

    return {
        address: wallet?.address ?? null,
        wallet,
        isReady: ready && !!wallet,
        isLoading: !ready,
    };
}

export function useEmbeddedSolanaAddress(): string | null {
    const { solanaAddress } = useEmbeddedWalletAddresses();
    return solanaAddress;
}

/** Swap UI: in-wallet (`accessPath` 2) always uses embedded Firefly wallets, not Privy’s first-linked external wallet */
export function useSwapContextWalletAddresses(): {
    evmAddress: string | null;
    solanaAddress: string | null;
    evmWalletName: string;
    solanaWalletName: string;
    isPrivyReady: boolean;
    isLoading: boolean;
} {
    const accessPath = useAtomValue(accessPathAtom);
    const cached = useCachedWalletAddresses();
    const embedded = useEmbeddedWalletAddresses();

    if (accessPath === SwapAccessPath.WalletGUI) {
        return {
            evmAddress: embedded.evmAddress,
            solanaAddress: embedded.solanaAddress,
            evmWalletName: 'Embedded',
            solanaWalletName: 'Embedded',
            isPrivyReady: embedded.isPrivyReady,
            isLoading: embedded.isLoading,
        };
    }

    return {
        evmAddress: cached.evmAddress,
        solanaAddress: cached.solanaAddress,
        evmWalletName: cached.evmWalletName,
        solanaWalletName: cached.solanaWalletName,
        isPrivyReady: cached.isPrivyReady,
        isLoading: cached.isLoading,
    };
}
