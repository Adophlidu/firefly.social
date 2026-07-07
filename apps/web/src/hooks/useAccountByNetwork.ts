'use client';

import { NetworkType } from '@dimensiondev/enums';
import { unreachable } from '@dimensiondev/utils';
import { solana } from '@dimensiondev/web3/chains';
import { isSameSolanaAddress } from '@dimensiondev/web3/utils';
import { first } from 'lodash-es';
import { useMemo } from 'react';
import { useConnection } from 'wagmi';

import { openWalletConnectModal } from '@/controllers/openWalletConnectModal.js';
import { useAppKitSolanaStore } from '@/store/useAppKitSolanaStore.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';

enum SolanaNetworkType {
    Appkit = 'appkit',
    Privy = 'privy-solana',
}

// The Solana state is read from the bridge store (see `AppKitSolanaStateBridge`)
// instead of the AppKit react hooks so `@reown/appkit/react` /
// `@reown/appkit-adapter-solana` stay out of the eager bundle: these hooks are
// called by components on read-only pages (collect, tips, swap buttons, ...).

export function useAccountByNetwork(networkType = NetworkType.Ethereum) {
    const account = useConnection();
    const connection = useAppKitSolanaStore((state) => state.connection);
    const solanaAddress = useAppKitSolanaStore((state) => state.address);

    switch (networkType) {
        case NetworkType.Ethereum:
            return {
                address: account.address ?? '',
                chainId: account.chainId,
                isConnected: account.isConnected,
            };
        case NetworkType.Solana:
            return {
                address: solanaAddress ?? '',
                chainId: solana.id,
                isConnected: !!connection && !!solanaAddress,
            };
        default:
            unreachable(networkType);
    }
}

export function useSolanaAccount() {
    const solanaAddress = useAppKitSolanaStore((state) => state.address);
    const connection = useAppKitSolanaStore((state) => state.connection);
    const solanaWallets = useFireflyWalletStore((state) => state.wallets[NetworkType.Solana]);

    const privySolana = first(solanaWallets)?.address;

    return useMemo(() => {
        return {
            address: solanaAddress ?? '',
            chainId: solana.id,
            isConnected: !!connection && !!solanaAddress,
            connect: () => openWalletConnectModal({ networkType: NetworkType.Solana }),
            type: isSameSolanaAddress(solanaAddress, privySolana) ? SolanaNetworkType.Privy : SolanaNetworkType.Appkit,
        };
    }, [connection, solanaAddress, privySolana]);
}

export function useWalletAccountAll() {
    const account = useConnection();
    const solana = useSolanaAccount();

    return useMemo(() => {
        const ethereum = {
            address: account.address ?? '',
            chainId: account.chainId,
            isConnected: account.isConnected && !!account.address,
            connect: () => openWalletConnectModal({ networkType: NetworkType.Ethereum }),
        };
        return {
            ethereum,
            solana,
        };
    }, [account.address, account.chainId, account.isConnected, solana]);
}
