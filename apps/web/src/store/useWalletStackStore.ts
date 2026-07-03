import { create } from 'zustand';

interface WalletStackState {
    /**
     * Whether the deferred wallet stack (WagmiProvider + AppKit + wallet modals)
     * has been mounted on the current whiteboard route. Non-whiteboard routes
     * mount the stack unconditionally and ignore this flag.
     */
    active: boolean;
    activate: () => void;
}

export const useWalletStackStore = create<WalletStackState>((set) => ({
    active: false,
    activate: () => set({ active: true }),
}));
