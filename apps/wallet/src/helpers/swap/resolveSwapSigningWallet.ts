import { type ConnectedWallet } from '@privy-io/react-auth';
import { type ConnectedStandardSolanaWallet } from '@privy-io/react-auth/solana';

import { type AppKitSolanaWallet } from '@/hooks/useAppKitSolanaWallets.js';

function isSameAddress(left: string | null | undefined, right: string | null | undefined): boolean {
    if (!left || !right) return false;
    return left.toLowerCase() === right.toLowerCase();
}

export function resolveSwapEvmSigningWallet(
    wallets: ConnectedWallet[],
    walletAddress: string | null,
    options?: {
        preferEmbedded?: boolean;
    },
): ConnectedWallet | null {
    if (!walletAddress) return null;

    const matches = wallets.filter((wallet) => isSameAddress(wallet.address, walletAddress));
    if (matches.length === 0) return null;

    if (options?.preferEmbedded) {
        return matches.find((wallet) => wallet.walletClientType === 'privy') ?? matches[0];
    }

    return matches[0];
}

export type ResolvedSolanaSigningWallet =
    | {
          type: 'privy';
          wallet: ConnectedStandardSolanaWallet;
      }
    | {
          type: 'appkit';
          wallet: AppKitSolanaWallet;
      };

export function resolveSwapSolanaSigningWallet(
    walletAddress: string | null,
    privyWallets: ConnectedStandardSolanaWallet[],
    appKitWallets: AppKitSolanaWallet[],
    options?: {
        preferEmbedded?: boolean;
    },
): ResolvedSolanaSigningWallet | null {
    if (!walletAddress) return null;

    const privyMatches = privyWallets.filter((wallet) => isSameAddress(wallet.address, walletAddress));
    if (privyMatches.length > 0) {
        if (options?.preferEmbedded) {
            const embeddedWallet = privyMatches.find(
                (wallet) => 'isPrivyWallet' in wallet.standardWallet && !!wallet.standardWallet.isPrivyWallet,
            );
            return { type: 'privy', wallet: embeddedWallet ?? privyMatches[0] };
        }

        return { type: 'privy', wallet: privyMatches[0] };
    }

    const appKitWallet = appKitWallets.find((wallet) => isSameAddress(wallet.address, walletAddress));
    if (!appKitWallet) return null;

    return { type: 'appkit', wallet: appKitWallet };
}
