import type { Provider } from '@reown/appkit-adapter-solana';
import type { Connection } from '@reown/appkit-utils/solana';
import { create } from 'zustand';

interface AppKitSolanaState {
    /** The connected Solana account address, if any. */
    address: string | undefined;
    /** The Solana RPC connection managed by AppKit, if initialized. */
    connection: Connection | undefined;
    /** The AppKit Solana wallet provider, if connected. */
    walletProvider: Provider | undefined;
    sync: (next: Pick<AppKitSolanaState, 'address' | 'connection' | 'walletProvider'>) => void;
}

/**
 * Mirror of the AppKit Solana react-hook state (`useAppKitAccount`,
 * `useAppKitConnection`, `useAppKitProvider`), written by
 * `AppKitSolanaStateBridge` which mounts with the deferred wallet stack.
 *
 * Read-only page components consume this store instead of the AppKit hooks so
 * `@reown/appkit/react` / `@reown/appkit-adapter-solana` stay out of the eager
 * bundle. Until the wallet stack activates, the store holds the same
 * disconnected defaults the AppKit hooks report before a connection exists.
 */
export const useAppKitSolanaStore = create<AppKitSolanaState>((set) => ({
    address: undefined,
    connection: undefined,
    walletProvider: undefined,
    sync: (next) => set(next),
}));
