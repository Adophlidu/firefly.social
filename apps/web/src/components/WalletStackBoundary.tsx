'use client';

import { WHITEBOARD_ROUTES } from '@dimensiondev/constants/static';
import { memo, type ReactNode } from 'react';

import { IfPathname } from '@/components/IfPathname.js';
import { dynamic } from '@/esm/dynamic.js';

// Deferred so the wagmi / AppKit-adapter chunks are not part of the eager
// provider graph loaded on every route (including /signup). ssr:true keeps
// non-whiteboard pages server-rendered under the wagmi context.
const WagmiProvider = dynamic(() => import('@/components/WagmiProvider.js').then((m) => m.WagmiProvider), {
    ssr: true,
});

interface Props {
    children: ReactNode;
}

/**
 * Mounts the app-wide WagmiProvider on non-whiteboard routes only.
 *
 * Whiteboard routes (e.g. /signup) render children without the wallet stack, so
 * wagmi / AppKit / WalletConnect stay out of first paint. On those routes the
 * wallet stack is instead mounted on demand around the modals once a wallet flow
 * activates it (see `Modals` + `activateWalletStack`). The signup page subtree
 * calls no wagmi hooks, so rendering it without the provider is safe.
 */
export const WalletStackBoundary = memo(function WalletStackBoundary({ children }: Props) {
    return (
        <IfPathname isNotOneOf={WHITEBOARD_ROUTES} otherwise={children}>
            <WagmiProvider>{children}</WagmiProvider>
        </IfPathname>
    );
});
