import { PRIVY_CONNECTOR_ID } from '@dimensiondev/constants/static';
import { isSameSolanaAddress } from '@dimensiondev/web3/utils';
import type { UseConnectionsReturnType } from 'wagmi';

import type { AppKitSolanaWallet } from '@/hooks/useAppKitSolanaWallets.js';

function isSameAddress(left: string | null | undefined, right: string | null | undefined): boolean {
    if (!left || !right) return false;
    return left.toLowerCase() === right.toLowerCase();
}

export function resolveSwapEvmSigningWallet(
    wallets: UseConnectionsReturnType,
    walletAddress: string | null,
    options?: {
        preferEmbedded?: boolean;
    },
): UseConnectionsReturnType[number] | null {
    if (!walletAddress) return null;

    const matches = wallets.filter((wallet) =>
        wallet.accounts.some((account) => isSameAddress(account, walletAddress)),
    );
    if (matches.length === 0) return null;

    if (options?.preferEmbedded) {
        return matches.find((wallet) => wallet.connector.id === PRIVY_CONNECTOR_ID) ?? matches[0];
    }

    return matches[0];
}

export interface ResolvedSolanaSigningWallet {
    type: 'appkit' | 'privy';
    wallet: AppKitSolanaWallet;
}

export function resolveSwapSolanaSigningWallet(
    walletAddress: string | null,
    appKitWallets: AppKitSolanaWallet[],
    options?: {
        preferEmbedded?: boolean;
    },
): ResolvedSolanaSigningWallet | null {
    if (!walletAddress || !appKitWallets.length) return null;

    if (options?.preferEmbedded) {
        const privyWallet = appKitWallets.find((wallet) => wallet.connection.connectorId === PRIVY_CONNECTOR_ID);
        if (privyWallet) {
            return {
                type: 'privy',
                wallet: privyWallet,
            };
        }
    }

    const appKitWallet = appKitWallets.find((wallet) => isSameSolanaAddress(wallet.address, walletAddress));
    if (!appKitWallet) return null;

    return { type: 'appkit', wallet: appKitWallet };
}
