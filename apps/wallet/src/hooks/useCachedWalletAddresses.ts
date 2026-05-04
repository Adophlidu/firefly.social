import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Address } from 'viem';

import { usePrivyWallet } from '@/hooks/usePrivyWallet.js';
import { accessPathAtom, SwapAccessPath } from '@/store/swap/swapState.js';
import {
    clearExpiredCachesAtom,
    getLatestValidWalletCache,
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

const EMBEDDED_WALLET_NAME = 'Embedded';

export function useCachedWalletAddresses(): CachedWalletAddresses {
    const { isPrivyReady, evmAddress, solanaAddress } = usePrivyWallet();

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

    return useMemo(() => {
        // If Privy is ready, use live addresses
        if (isPrivyReady) {
            return {
                evmAddress,
                solanaAddress,
                evmWalletName: EMBEDDED_WALLET_NAME,
                solanaWalletName: EMBEDDED_WALLET_NAME,
                isFromCache: false,
                isPrivyReady: true,
                isLoading: false,
            };
        }

        // Use cached addresses from localStorage (read on mount)
        const evmAddressInCache = initialCache?.evmAddress ?? null;
        const solanaAddressInCache = initialCache?.solanaAddress ?? null;
        const hasCache = evmAddressInCache !== null && solanaAddressInCache !== null;

        return {
            evmAddress: evmAddressInCache,
            solanaAddress: solanaAddressInCache,
            evmWalletName: EMBEDDED_WALLET_NAME,
            solanaWalletName: EMBEDDED_WALLET_NAME,
            isFromCache: hasCache,
            isPrivyReady: false,
            isLoading: !hasCache,
        };
    }, [isPrivyReady, initialCache, evmAddress, solanaAddress]);
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
} {
    const { isPrivyReady, evmAddress, solanaAddress } = usePrivyWallet();

    return {
        evmAddress,
        solanaAddress,
        isPrivyReady,
        isLoading: !isPrivyReady,
    };
}

export function useEmbeddedEvmAddress(): string | null {
    const { evmAddress } = useEmbeddedWalletAddresses();
    return evmAddress;
}

export function useEmbeddedEvmWalletContext(): {
    address: Address | null;
    isReady: boolean;
    isLoading: boolean;
} {
    const { isPrivyReady, evmAddress } = usePrivyWallet();

    return {
        address: evmAddress as Address | null,
        isReady: isPrivyReady,
        isLoading: !isPrivyReady,
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
