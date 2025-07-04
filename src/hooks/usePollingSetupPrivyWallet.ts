import { useSolanaWallets, useWallets } from '@privy-io/react-auth';
import { useQuery } from '@tanstack/react-query';
import { connect, getConnectors } from '@wagmi/core';
import { useConnections } from 'wagmi';

import { config } from '@/configs/wagmiClient.js';
import { getPrivyBridge, PRIVY_CONNECTOR_ID } from '@/connectors/PrivyConnector.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';

export function usePollingSetupPrivyWallet() {
    const connections = useConnections();
    const isLoginFirefly = useIsLoginFirefly();
    const { wallets: evmWallets } = useWallets();
    const { wallets: solanaWallets } = useSolanaWallets();
    const enabled =
        isLoginFirefly && (!evmWallets.length || !solanaWallets.length || evmWallets.length > connections.length);

    useQuery({
        queryKey: ['polling-setup-privy', enabled],
        async queryFn() {
            if (!enabled) return;
            getPrivyBridge()?.reload();
            const connectors = getConnectors(config);
            const connector = connectors.find((x) => x.id === PRIVY_CONNECTOR_ID);
            if (connector) await connect(config, { connector });
        },
        refetchInterval: 1000 * 10,
        enabled,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
