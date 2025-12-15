'use client';

import { unreachable } from '@dimensiondev/utils';
import { useAppKitAccount } from '@reown/appkit/react';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { first } from 'lodash-es';
import { useMemo } from 'react';
import { useConnection } from 'wagmi';

import { NetworkType, SolanaNetworkType } from '@/constants/enum.js';
import { isSameSolanaAddress } from '@/helpers/isSameAddress.js';
import { WalletConnectModalRef } from '@/modals/WalletConnectModal/index.js';
import { useFireflyWalletStore } from '@/store/useFireflyWalletStore.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export function useAccountByNetwork(networkType = NetworkType.Ethereum) {
    const account = useConnection();
    const { connection } = useAppKitConnection();
    const { address: solanaAddress } = useAppKitAccount({ namespace: 'solana' });

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
                chainId: SolanaChainId.Mainnet,
                isConnected: !!connection && !!solanaAddress,
            };
        default:
            unreachable(networkType);
    }
}

export function useSolanaAccount() {
    const { address: solanaAddress } = useAppKitAccount({ namespace: 'solana' });
    const { connection } = useAppKitConnection();
    const solanaWallets = useFireflyWalletStore((state) => state.wallets[NetworkType.Solana]);

    const privySolana = first(solanaWallets)?.address;

    return useMemo(() => {
        return {
            address: solanaAddress ?? '',
            chainId: SolanaChainId.Mainnet,
            isConnected: !!connection && !!solanaAddress,
            connect: () => WalletConnectModalRef.open({ networkType: NetworkType.Solana }),
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
            connect: () => WalletConnectModalRef.open({ networkType: NetworkType.Ethereum }),
        };
        return {
            ethereum,
            solana,
        };
    }, [account.address, account.chainId, account.isConnected, solana]);
}
