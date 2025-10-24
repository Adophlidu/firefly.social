import { useQuery } from '@tanstack/react-query';
import { watchAccount } from '@wagmi/core';
import { useRouter } from 'next/navigation.js';
import { type PropsWithChildren, useEffect, useRef } from 'react';
import { useConnect, useSwitchAccount } from 'wagmi';

import { Loading } from '@/components/Loading.js';
import { wagmiConfig } from '@/configs/wagmiClient.js';
import { NetworkType } from '@/constants/enum.js';
import { isSameAddress } from '@/helpers/isSameAddress.js';
import { useWalletAccountAll } from '@/hooks/useAccountByNetwork.js';
import { useWalletConnections } from '@/hooks/useWalletConnections.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';
import { SolanaNetworkType, useSolanaActiveNetworkStore } from '@/store/useSolanaActiveNetworkStore.js';

export function SelectPrivyWalletGuard({ children }: PropsWithChildren) {
    const connections = useWalletConnections();
    const connection = connections.find((x) => x.connector?.id === 'network.privy');
    const { ethereum } = useWalletAccountAll();
    const ready = usePrivyWalletStore((state) => state.ready);
    const evmWallets = usePrivyWalletStore((state) => state.wallets[NetworkType.Ethereum]);
    const { switchAccountAsync } = useSwitchAccount();
    const { connectAsync } = useConnect();
    const router = useRouter();
    const wallet = evmWallets.find((x) => x.connectorType === 'embedded');

    const isSetupSolanaRef = useRef(false);
    const { data: isSetupEvm = false } = useQuery({
        queryKey: ['set-privy-evm-connector', ethereum.address, wallet?.address],
        async queryFn() {
            const connector = connection?.connector;
            if (!wallet || !ethereum || !connector) return false;
            if (isSameAddress(wallet.address, ethereum.address)) return true;
            await connector.connect();
            await connectAsync({ connector });
            await switchAccountAsync({ connector });
            return false;
        },
        enabled: ready,
        refetchInterval(query) {
            if (query.state.data) return;
            return 2000;
        },
    });

    // watching evm account
    useEffect(() => {
        if (!isSetupEvm) return;
        return watchAccount(wagmiConfig, {
            onChange(account) {
                if (!isSameAddress(wallet?.address, account.address)) {
                    router.push('/');
                }
            },
        });
    }, [router, wallet?.address, isSetupEvm]);

    // watching solana account
    useEffect(() => {
        return useSolanaActiveNetworkStore.subscribe((state) => {
            if (!isSetupSolanaRef.current) return;
            if (state.activeNetwork !== SolanaNetworkType.Privy) {
                router.push('/');
            }
        });
    }, [router]);

    useEffect(() => {
        if (isSetupSolanaRef.current || !ready) return;
        useSolanaActiveNetworkStore.getState().setActiveNetwork(SolanaNetworkType.Privy);
        isSetupSolanaRef.current = true;
    }, [ready]);

    if (!connection || !wallet || !ethereum || !isSameAddress(ethereum.address, wallet.address)) return <Loading />;
    return children;
}
