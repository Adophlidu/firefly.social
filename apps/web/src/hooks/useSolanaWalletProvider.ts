import { useAppKitSolanaStore } from '@/store/useAppKitSolanaStore.js';

/**
 * The AppKit Solana wallet provider, read from the bridge store (see
 * `AppKitSolanaStateBridge`) instead of `useAppKitProvider` so the AppKit react
 * packages stay out of the eager bundle on read-only pages. Undefined until the
 * wallet stack is active and a Solana wallet is connected — the same value the
 * AppKit hook reports in that state.
 */
export function useSolanaWalletProvider() {
    return useAppKitSolanaStore((state) => state.walletProvider);
}
