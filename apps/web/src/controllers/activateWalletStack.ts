'use client';

import { loadWagmiClient } from '@/configs/wagmiClientLoader.js';
import { useWalletStackStore } from '@/store/useWalletStackStore.js';

/**
 * Mount the deferred wallet stack (real wagmi config + AppKit + wallet modals).
 *
 * `'use client'` is load-bearing for the bundle, not just correctness: this
 * module is reachable from server components through `dispatchModalEvent` (via
 * the shared `open*Modal` controllers). Without the directive Turbopack
 * compiles it in the RSC layer, where each `import()` below of a `'use client'`
 * module (WagmiProvider, wagmiClient, WalletModals) registers a client
 * reference in every page's client-reference manifest — and Turbopack merges
 * all client-reference entries of a page into one shared chunk group, which
 * put the whole AppKit/adapter/phantom stack back into every page's eager
 * SSR script tags (~1MB gz). With the directive the boundary sits here, and
 * the imports stay lazy client-layer edges.
 *
 * The heavy chunks are preloaded before the flag flips so the subsequent mount
 * is synchronous — no Suspense fallback / blank flash — and AppKit is
 * initialized before any wallet hook (e.g. LensView, WalletConnectModal)
 * renders. This is invoked from interaction points (wallet modal opens, the
 * signup login step) or at boot when a persisted wallet/Firefly session exists
 * (see `WalletStackBootstrap`), never during first paint.
 */
export async function activateWalletStack(): Promise<void> {
    if (useWalletStackStore.getState().active) return;

    try {
        await Promise.all([
            import('@/components/WagmiProvider.js'),
            loadWagmiClient(),
            import('@/modals/WalletModals.js'),
        ]);
    } catch {
        // Ignore preload failures; the dynamic boundaries will retry the load on render.
    }

    useWalletStackStore.getState().activate();
}
