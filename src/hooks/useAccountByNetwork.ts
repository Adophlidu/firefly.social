import { unreachable } from '@firefly/utils';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { first } from 'lodash-es';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';

import { PrivySolanaProvider } from '@/connectors/PrivySolanaWalletAdapter.js';
import { NetworkType } from '@/constants/enum.js';
import { useSolanaWalletProvider } from '@/hooks/useSolanaWalletProvider.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

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
    const { address: solanaAddress } = useAppKitAccount({ namespace: 'solana' });
    const { connection } = useAppKitConnection();
    const solanaWallets = usePrivyWalletStore((state) => state.wallets[NetworkType.Solana]);
    const { activeNetwork } = useSolanaActiveNetworkStore();
    return useMemo(() => {
        const connections = [
            {
                address: solanaAddress ?? '',
                chainId: SolanaChainId.Mainnet,
                isConnected: !!connection && !!solanaAddress,
                connect: () => WalletConnectModalRef.open({ networkType: NetworkType.Solana }),
                type: SolanaNetworkType.Appkit,
            },
            {
                address: first(solanaWallets)?.address,
                chainId: SolanaChainId.Mainnet,
                isConnected: !!first(solanaWallets),
                connect: () => console.info('Connected to privy already'),
                type: SolanaNetworkType.Privy,
            },
        ];
        const filteredConnections = connections.filter((x) => x.isConnected);
        return (
            filteredConnections.find((x) => x.type === activeNetwork) ??
            first(filteredConnections) ??
            first(connections)!
        );
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
