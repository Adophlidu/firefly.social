import { CoreApiController, CoreConnectorController, type WcWallet } from '@reown/appkit';
import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';

import { NetworkType } from '@/constants/enum.js';
import type { ConnectorWithProvider } from '@/modals/WalletConnectModal/WalletList.js';

interface WalletConnectContext {
    networkType?: NetworkType;
    connectors: ConnectorWithProvider[];
    featuredWallets: WcWallet[];
}

function createEmptyContext(): WalletConnectContext {
    return {
        networkType: undefined,
        connectors: CoreConnectorController.state?.connectors || [],
        featuredWallets: CoreApiController.state?.featured || [],
    };
}

async function setupApi() {
    await CoreApiController.fetchFeaturedWallets();
    await CoreApiController.fetchConnectorImages();
}

function networkTypeToChainNamespace(networkType: NetworkType) {
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
    const [loading, setLoading] = useState(false);
    const [value, setValue] = useState<WalletConnectContext>(initialState ?? createEmptyContext());

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
        setLoading(true);
        setupApi().finally(() => {
            setLoading(false);
        });
    }, []);

    return {
        ...value,
        chainNamespace: value.networkType ? networkTypeToChainNamespace(value.networkType) : null,
        loading,
        updateNetworkType: (networkType?: NetworkType) => setValue((prev) => ({ ...prev, networkType })),
        reset: () => setValue((prev) => ({ ...prev, networkType: undefined })),
    };
}

export const WalletConnectContext = createContainer(useWalletConnectContext);
