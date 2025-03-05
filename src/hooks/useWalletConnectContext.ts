import { CoreApiController, CoreConnectorController, type WcWallet } from '@reown/appkit';
import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';

import { NetworkType } from '@/constants/enum.js';
import type { ChainNamespace, ConnectorWithProvider } from '@/types/index.js';

interface WalletConnectState {
    connectors: ConnectorWithProvider[];
    featuredWallets: WcWallet[];
}

interface WalletConnectContext extends WalletConnectState {
    loading: boolean;

    chainNamespace: ChainNamespace | null;

    networkType: NetworkType | null;
    setNetworkType: (networkType?: NetworkType) => void;
    unsetNetworkType: () => void;
}

function createEmptyWalletConnectState(): WalletConnectState {
    return {
        connectors: CoreConnectorController.state?.connectors || [],
        featuredWallets: CoreApiController.state?.featured || [],
    };
}

async function setupApi() {
    await CoreApiController.prefetch();
}

function networkTypeToChainNamespace(networkType: NetworkType): ChainNamespace | null {
    switch (networkType) {
        case NetworkType.Ethereum:
            return 'eip155';
        case NetworkType.Solana:
            return 'solana';
        default:
            return null;
    }
}

function useWalletConnectContext(initialState?: WalletConnectContext) {
    const [value, setValue] = useState<WalletConnectState>(initialState ?? createEmptyWalletConnectState());

    const [loading, setLoading] = useState(true);
    const [networkType, setNetworkType] = useState<NetworkType | null>(null);

    // subscribe events
    useEffect(() => {
        const unsubscribeInjected = CoreConnectorController.subscribeKey('connectors', (connectors) => {
            setValue((prev) => ({ ...prev, connectors }));
        });
        const unsubscribeFeatured = CoreApiController.subscribeKey('featured', (featured) => {
            setValue((prev) => ({ ...prev, featuredWallets: featured }));
        });

        return () => {
            unsubscribeInjected();
            unsubscribeFeatured();
        };
    }, []);

    // setup api
    useEffect(() => {
        setupApi().finally(() => {
            setLoading(false);
        });
    }, []);

    return {
        connectors: value.connectors,
        featuredWallets: value.featuredWallets,
        loading,
        chainNamespace: networkType ? networkTypeToChainNamespace(networkType) : null,
        setNetworkType: (networkType?: NetworkType) => setNetworkType(networkType ?? null),
        unsetNetworkType: () => setNetworkType(null),
    } as WalletConnectContext;
}

export const WalletConnectContext = createContainer(useWalletConnectContext);
