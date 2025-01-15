import { unreachable } from '@masknet/kit';
import { ChainId } from '@masknet/web3-shared-solana';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAccount } from 'wagmi';

import { NetworkType } from '@/constants/enum.js';

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
