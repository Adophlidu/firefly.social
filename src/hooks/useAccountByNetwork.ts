import { unreachable } from '@masknet/kit';
import { ChainId } from '@masknet/web3-shared-solana';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { NetworkType } from '@/constants/enum.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { ConnectModalRef } from '@/modals/controls.js';

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
                chainId: ChainId.Mainnet,
                isConnected: !!connection,
            };
        default:
            unreachable(networkType);
    }
}

export function useWalletAccountAll() {
    const account = useAccount();
    const walletProvider = useSolanaWalletProvider();
    const { connection } = useAppKitConnection();

    return useMemo(
        () => ({
            ethereum: {
                address: account.address ?? '',
                chainId: account.chainId,
                isConnected: account.isConnected,
                connect: () => ConnectModalRef.open(),
            },
            solana: {
                address: walletProvider?.publicKey?.toBase58() ?? '',
                chainId: ChainId.Mainnet,
                isConnected: !!connection,
                connect: () => ConnectModalRef.open(),
            },
        }),
        [account.address, account.chainId, account.isConnected, walletProvider?.publicKey, connection],
    );
}
