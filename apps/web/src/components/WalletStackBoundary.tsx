'use client';

import { WHITEBOARD_ROUTES } from '@dimensiondev/constants/static';
import { memo, type ReactNode } from 'react';

import { IfPathname } from '@/components/IfPathname.js';
import { WalletStackBootstrap } from '@/components/WalletStackBootstrap.js';
import { dynamic } from '@/esm/dynamic.js';

// Deferred so the wagmi react-core chunk is not part of the eager provider
// graph on whiteboard routes (e.g. /signup). The heavy wallet stack itself
// (chains + AppKit adapter + Privy connector) is deferred on ALL routes inside
// WagmiProvider, which serves a lightweight connector-less fallback config
// until the wallet stack activates. ssr:true keeps non-whiteboard pages
// server-rendered under the wagmi context.
const WagmiProvider = dynamic(() => import('@/components/WagmiProvider.js').then((m) => m.WagmiProvider), {
    ssr: true,
});

interface Props {
    children: ReactNode;
}

/**
 * Mounts the app-wide wagmi provider shell on non-whiteboard routes.
 *
 * The shell always provides a wagmi context (so read-only components can call
 * wagmi hooks), but the real wallet stack — 26 viem chains, AppKit wagmi
 * adapter, Privy connector, AppKit init, wallet modals — stays unloaded until
 * `useWalletStackStore.active` flips: at boot for visitors with a persisted
 * wallet/Firefly session (see `WalletStackBootstrap`), or on the first
 * wallet-requiring interaction (see `activateWalletStack` and the modal gates
 * in `controllers/dispatchModalEvent.ts`).
 *
 * Whiteboard routes (e.g. /signup) additionally skip the shell so even the
 * wagmi react-core chunk stays out of first paint; there the stack is mounted
 * on demand around the modals once a wallet flow activates it (see `Modals`).
 */
export const WalletStackBoundary = memo(function WalletStackBoundary({ children }: Props) {
    return (
        <IfPathname isNotOneOf={WHITEBOARD_ROUTES} otherwise={children}>
            <WagmiProvider>{children}</WagmiProvider>
            <WalletStackBootstrap />
        </IfPathname>
    );
});
