import { useQuery } from '@tanstack/react-query';

import { getPrivyBridge } from '@/connectors/PrivyConnector.js';
import { NetworkType } from '@/constants/enum.js';
import { useIsLoginFirefly } from '@/hooks/useIsLogin.js';
import { usePrivyWalletStore } from '@/store/usePrivyWalletsStore.js';

export function usePollingSetupPrivyWallet() {
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
            return getPrivyBridge()?.isReady ?? false;
        },
        refetchInterval(query) {
            if (query.state.data) return;
            return 1000 * 5;
        },
        enabled,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
