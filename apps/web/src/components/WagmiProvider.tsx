'use client';

import { memo, type ReactNode, useEffect, useState } from 'react';
import { type Config, WagmiProvider as WagmiProviderSDK } from 'wagmi';

import { loadWagmiClient } from '@/configs/wagmiClientLoader.js';
import { fallbackWagmiConfig } from '@/configs/wagmiFallbackClient.js';
import { useWalletStackStore } from '@/store/useWalletStackStore.js';

interface WagmiProviderProps {
    children: ReactNode;
}

/**
 * Provides the wagmi context app-wide while keeping the heavy wallet stack
 * (`configs/wagmiClient.ts`: 26 viem chains + AppKit wagmi adapter + Privy
 * connector) out of the eager bundle.
 *
 * Until the wallet stack activates (see `useWalletStackStore` /
 * `activateWalletStack`), consumers get the lightweight connector-less
 * `fallbackWagmiConfig`, which serves the read paths (chains, RPC reads, ENS)
 * and reports "disconnected" — exactly what a visitor without a wallet session
 * sees. Once active, the real config is hot-swapped in place: the provider stays
 * mounted so the app subtree is NOT remounted, wagmi hooks simply re-render
 * against the real config, and wagmi's `Hydrate` re-runs its non-SSR mount path
 * with the new config, which re-hydrates persisted connections and reconnects.
 */
export const WagmiProvider = memo(function WagmiProvider({ children }: WagmiProviderProps) {
    const active = useWalletStackStore((state) => state.active);
    const [config, setConfig] = useState<Config | null>(null);

    useEffect(() => {
        if (!active || config) return;

        let disposed = false;
        loadWagmiClient().then(
            (module) => {
                if (!disposed) setConfig(module.wagmiConfig);
            },
            () => {
                // Ignore load failures; consumers keep the fallback config (reads keep
                // working, connections stay unavailable) until the next full page load.
            },
        );
        return () => {
            disposed = true;
        };
    }, [active, config]);

    return <WagmiProviderSDK config={config ?? fallbackWagmiConfig}>{children}</WagmiProviderSDK>;
});
