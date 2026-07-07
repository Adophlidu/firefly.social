'use client';

import { useWalletStackStore } from '@/store/useWalletStackStore.js';

/**
 * Mount the deferred `AppModals` cluster (compose, tips, red packet, collect,
 * token selector, ...). The chunk is preloaded before the flag flips so the
 * mount is synchronous and the pending modal open (re-dispatched by
 * `controllers/dispatchModalEvent.ts`) finds its listener right away.
 *
 * `'use client'` keeps this module out of the RSC layer (it is reachable from
 * server components via `dispatchModalEvent`); otherwise the `import()` below
 * registers `AppModals` as a page client reference and Turbopack merges its
 * chunks into every page's eager chunk group. See `activateWalletStack.ts`.
 */
export async function activateAppModals(): Promise<void> {
    if (useWalletStackStore.getState().appModalsActive) return;

    try {
        await import('@/modals/AppModals.js');
    } catch {
        // Ignore preload failures; the dynamic boundary will retry the load on render.
    }

    useWalletStackStore.getState().activateAppModals();
}
