import { unreachable } from '@masknet/kit';
import { SolanaChainId } from '@masknet/web3-shared-solana';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { NetworkType } from '@/constants/enum.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { WalletConnectModalRef } from '@/modals/controls.js';

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
    const solanaAddress = walletProvider?.publicKey?.toBase58();

    return useMemo(
        () => ({
            ethereum: {
                address: account.address ?? '',
                chainId: account.chainId,
                isConnected: account.isConnected && !!account.address,
                connect: () => WalletConnectModalRef.open({ networkType: NetworkType.Ethereum }),
            },
            solana: {
                address: solanaAddress ?? '',
                chainId: SolanaChainId.Mainnet,
                isConnected: !!connection && !!solanaAddress,
                connect: () => WalletConnectModalRef.open({ networkType: NetworkType.Solana }),
            },
        }),
        [account.address, account.chainId, account.isConnected, solanaAddress, connection],
    );
}
