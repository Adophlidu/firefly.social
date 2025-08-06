import { useQuery } from '@tanstack/react-query';
import { connect, getConnectors } from '@wagmi/core';
import { useAccount } from 'wagmi';

import { wagmiConfig } from '@/configs/wagmiClient.js';
import { getPrivyBridge, PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { NetworkType } from '@/constants/enum.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';

export function usePollingSetupPrivyWallet() {
    const account = useAccount();
    const isLoginFirefly = useIsLoginFirefly();
    const { evmWallets, solanaWallets } = usePrivyWalletStore((state) => ({
        evmWallets: state.wallets[NetworkType.Ethereum],
        solanaWallets: state.wallets[NetworkType.Solana],
    }));
    const enabled = isLoginFirefly && (!evmWallets.length || !solanaWallets.length);

    useQuery({
        queryKey: ['polling-setup-privy', enabled],
        async queryFn() {
            if (!enabled) return;
            getPrivyBridge()?.reload();
            const connectors = getConnectors(wagmiConfig);
            const connector = connectors.find((x) => x.id === PRIVY_CONNECTOR_ID);
            if (connector) await connect(wagmiConfig, { connector });
        },
        refetchInterval() {
            if (account.connector?.id === PRIVY_CONNECTOR_ID) return;
            return 1000 * 5;
        },
        enabled,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
