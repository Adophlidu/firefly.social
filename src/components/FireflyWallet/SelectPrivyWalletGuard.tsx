import { useWallets } from '@privy-io/react-auth';
import { watchAccount } from '@wagmi/core';
import { useRouter } from 'next/navigation.js';
import { type PropsWithChildren, useEffect, useRef } from 'react';
import { useSwitchAccount } from 'wagmi';

import { Loading } from '@/components/Loading.js';
import { config } from '@/configs/wagmiClient.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useWalletConnections } from '@/hooks/useWalletConnections.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';

export function SelectPrivyWalletGuard({ children }: PropsWithChildren) {
    const isSetupRef = useRef(false);
    const connections = useWalletConnections();
    const connection = connections.find((x) => x.connector?.id === 'network.privy');
    const { ethereum } = useWalletAccountAll();
    const { wallets: evmWallets } = useWallets();
    const { switchAccountAsync } = useSwitchAccount();
    const router = useRouter();
    const wallet = evmWallets.find((x) => x.connectorType === 'embedded');

    // watching evm account
    useEffect(() => {
        return watchAccount(config, {
            onChange(account) {
                if (!isSameAddress(wallet?.address, account.address)) {
                    router.push('/');
                }
            },
        });
    }, [router, wallet?.address]);

    // watching solana account
    useEffect(() => {
        return useSolanaActiveNetworkStore.subscribe((state) => {
            if (!isSetupRef.current) return;
            if (state.activeNetwork !== SolanaNetworkType.Privy) {
                router.push('/');
            }
        });
    }, [router]);

    useEffect(() => {
        if (!ethereum || isSetupRef.current) return;
        if (wallet && connection?.connector && ethereum && !isSameAddress(wallet?.address, ethereum.address)) {
            switchAccountAsync({ connector: connection.connector });
        }
        useSolanaActiveNetworkStore.getState().setActiveNetwork(SolanaNetworkType.Privy);
        isSetupRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ethereum, wallet]);

    if (!connection || !wallet || !ethereum || !isSameAddress(ethereum.address, wallet.address)) return <Loading />;
    return children;
}
