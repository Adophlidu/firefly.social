import { safeUnreachable, unreachable } from '@masknet/kit';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { first } from 'lodash-es';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { PrivySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { NetworkType } from '@/constants/enum.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { WalletConnectModalRef } from '@/modals/controls.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';
import { SolanaChainId } from '#masknet/web3-shared-solana';

export function useAccountByNetwork(networkType = NetworkType.Ethereum) {
    const account = useAccount();
    const walletProvider = useSolanaWalletProvider();
    const { connection } = useAppKitConnection();

    switch (networkType) {
        case NetworkType.Ethereum:
            return {
                address: account.address ?? '',
                chainId: account.chainId,
                isConnected: account.isConnected,
            };
        case NetworkType.Solana:
            return {
                address: walletProvider?.publicKey?.toBase58() ?? '',
                chainId: SolanaChainId.Mainnet,
                isConnected: walletProvider === PrivySolanaProvider ? true : !!connection,
            };
        default:
            unreachable(networkType);
    }
}

export function useSolanaAccount() {
    const walletProvider = useSolanaWalletProvider();
    const solanaAddress = walletProvider?.publicKey?.toBase58();
    const { connection } = useAppKitConnection();
    const solanaWallets = usePrivyWalletStore((state) => state.wallets[NetworkType.Solana]);
    const { activeNetwork } = useSolanaActiveNetworkStore();
    return useMemo(() => {
        switch (activeNetwork) {
            case SolanaNetworkType.Appkit:
                return {
                    address: solanaAddress ?? '',
                    chainId: SolanaChainId.Mainnet,
                    isConnected: !!connection && !!solanaAddress,
                    connect: () => WalletConnectModalRef.open({ networkType: NetworkType.Solana }),
                };
            case SolanaNetworkType.Privy:
                return {
                    address: first(solanaWallets)?.address,
                    chainId: SolanaChainId.Mainnet,
                    isConnected: true,
                    connect: () => console.info('Connected to privy already'),
                };
            default:
                safeUnreachable(activeNetwork);
                return {
                    address: solanaAddress ?? '',
                    chainId: SolanaChainId.Mainnet,
                    isConnected: !!connection && !!solanaAddress,
                    connect: () => WalletConnectModalRef.open({ networkType: NetworkType.Solana }),
                };
        }
    }, [activeNetwork, connection, solanaAddress, solanaWallets]);
}

export function useWalletAccountAll() {
    const account = useAccount();
    const solana = useSolanaAccount();

    return useMemo(() => {
        const ethereum = {
            address: account.address ?? '',
            chainId: account.chainId,
            isConnected: account.isConnected && !!account.address,
            connect: () => WalletConnectModalRef.open({ networkType: NetworkType.Ethereum }),
        };
        return {
            ethereum,
            solana,
        };
    }, [account.address, account.chainId, account.isConnected, solana]);
}
