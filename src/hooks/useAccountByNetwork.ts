import { unreachable } from '@masknet/kit';
import { ChainId } from '@masknet/web3-shared-solana';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { NetworkType } from '@/constants/enum.js';
import { ConnectModalRef } from '@/modals/controls.js';

export function useAccountByNetwork(networkType = NetworkType.Ethereum) {
    const account = useAccount();
    const wallet = useWallet();

    switch (networkType) {
        case NetworkType.Ethereum:
            return {
                address: account.address ?? '',
                chainId: account.chainId,
                isConnected: account.isConnected,
            };
        case NetworkType.Solana:
            return {
                address: wallet.publicKey?.toBase58() ?? '',
                chainId: ChainId.Mainnet,
                isConnected: wallet.connected,
            };
        default:
            unreachable(networkType);
    }
}

export function useWalletAccountAll() {
    const account = useAccount();
    const wallet = useWallet();
    const solanaWalletModal = useWalletModal();

    return useMemo(
        () => ({
            ethereum: {
                address: account.address ?? '',
                chainId: account.chainId,
                isConnected: account.isConnected,
                connect: () => ConnectModalRef.open(),
            },
            solana: {
                address: wallet.publicKey?.toBase58() ?? '',
                chainId: ChainId.Mainnet,
                isConnected: wallet.connected,
                connect: () => solanaWalletModal.setVisible(true),
            },
        }),
        [account.address, account.chainId, account.isConnected, wallet.publicKey, wallet.connected, solanaWalletModal],
    );
}
