import '@/configs/appkit.js';

import { chains } from '@dimensiondev/web3/chains';
import { type PrivyClientConfig, PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider, useAtomValue } from 'jotai';
import { type PropsWithChildren, useMemo } from 'react';
import { mainnet } from 'viem/chains';

import { queryClient } from '@/configs/queryClient.js';
import { config } from '@/configs/wagmiClient.js';
import { env } from '@/constants/env.js';
import { getSolanaRPCSubscriptionsUrl } from '@/helpers/getSolanaRPCSubscriptionsUrl.js';
import { useIsDarkMode } from '@/hooks/useIsDarkMode.js';
import { showEmbeddedWalletUIAtom } from '@/store/embeddedWallets.js';
import { store } from '@/store/index.js';

function PrivyThemedProvider({ children }: PropsWithChildren) {
    const isDarkMode = useIsDarkMode();
    const showEmbeddedWalletUI = useAtomValue(showEmbeddedWalletUIAtom);

    const config = useMemo(() => {
        return {
            appearance: {
                showWalletLoginFirst: true,
                walletChainType: 'ethereum-and-solana',
                theme: isDarkMode ? 'dark' : 'light',
            },
            externalWallets: {
                disableAllExternalWallets: false,
            },
            embeddedWallets: {
                showWalletUIs: showEmbeddedWalletUI,
            },
            supportedChains: [...chains],
            defaultChain: mainnet,
            fundingMethodConfig: {
                moonpay: {
                    uiConfig: {
                        theme: isDarkMode ? 'dark' : 'light',
                    },
                },
            },
            solana: {
                rpcs: {
                    'solana:mainnet': {
                        rpc: createSolanaRpc(env.external.NEXT_PUBLIC_SOLANA_RPC_URL),
                        rpcSubscriptions: createSolanaRpcSubscriptions(getSolanaRPCSubscriptionsUrl()),
                    },
                },
            },
        } satisfies PrivyClientConfig;
    }, [isDarkMode, showEmbeddedWalletUI]);

    return (
        <PrivyProvider appId={env.external.NEXT_PUBLIC_PRIVY_APP_ID} config={config}>
            {children}
        </PrivyProvider>
    );
}

export function Providers({ children }: PropsWithChildren) {
    return (
        <JotaiProvider store={store}>
            <PrivyThemedProvider>
                <QueryClientProvider client={queryClient}>
                    <WagmiProvider config={config}>{children}</WagmiProvider>
                </QueryClientProvider>
            </PrivyThemedProvider>
        </JotaiProvider>
    );
}
