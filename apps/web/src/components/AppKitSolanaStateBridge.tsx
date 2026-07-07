'use client';

import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { useEffect } from 'react';

import { useAppKitSolanaStore } from '@/store/useAppKitSolanaStore.js';

/**
 * Bridges the AppKit Solana react-hook state into `useAppKitSolanaStore`.
 *
 * Mounted inside `WalletModals` (i.e. only once the deferred wallet stack is
 * active and `createAppKit()` has run), so it is the single module that keeps a
 * static dependency on the AppKit react hooks. Everything that renders on
 * read-only pages consumes the store instead.
 */
export function AppKitSolanaStateBridge() {
    const { address } = useAppKitAccount({ namespace: 'solana' });
    const { connection } = useAppKitConnection();
    const { walletProvider } = useAppKitProvider<Provider | undefined>('solana');
    const sync = useAppKitSolanaStore((state) => state.sync);

    useEffect(() => {
        sync({ address, connection: connection ?? undefined, walletProvider });
    }, [address, connection, walletProvider, sync]);

    return null;
}
