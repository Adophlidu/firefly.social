import { useWalletStackStore } from '@/store/useWalletStackStore.js';

/**
 * Mount the deferred wallet stack (WagmiProvider + AppKit + WalletConnect modal)
 * on whiteboard routes such as /signup, where it is otherwise kept out of first
 * paint.
 *
 * The heavy chunks are preloaded before the flag flips so the subsequent mount
 * is synchronous — no Suspense fallback / blank flash — and AppKit is
 * initialized before any wallet hook (e.g. LensView, WalletConnectModal)
 * renders. This is invoked from an interaction point (the signup login step),
 * never during first paint.
 */
export async function activateWalletStack(): Promise<void> {
    if (useWalletStackStore.getState().active) return;

    try {
        await Promise.all([import('@/components/WagmiProvider.js'), import('@/modals/WalletModals.js')]);
    } catch {
        // Ignore preload failures; the dynamic boundaries will retry the load on render.
    }

    useWalletStackStore.getState().activate();
}
