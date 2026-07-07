import { create } from 'zustand';

interface WalletStackState {
    /**
     * Whether the deferred wallet stack (real wagmi config + AppKit +
     * WalletConnect/MyWallets modals + FireflyWallet dock) has been mounted.
     *
     * Defaults to false everywhere: read-only page views keep the wallet chunks
     * unloaded. It flips at boot when a persisted wallet/Firefly session exists
     * (see `WalletStackBootstrap`) or when a wallet-requiring interaction starts
     * (see `activateWalletStack` and the modal gates in
     * `controllers/dispatchModalEvent.ts`).
     */
    active: boolean;
    activate: () => void;
    /**
     * Whether the deferred non-critical modal cluster (`modals/AppModals.tsx`:
     * compose, tips, red packet, collect, token selector, ...) has been mounted.
     * Flips on the first open of any modal in that cluster (see
     * `activateAppModals` and `controllers/dispatchModalEvent.ts`).
     */
    appModalsActive: boolean;
    activateAppModals: () => void;
}

export const useWalletStackStore = create<WalletStackState>((set) => ({
    active: false,
    activate: () => set({ active: true }),
    appModalsActive: false,
    activateAppModals: () => set({ appModalsActive: true }),
}));
