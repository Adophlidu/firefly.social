import {
    type ChainAdapter,
    CoreApiController,
    CoreChainController,
    CoreConnectorController,
    type WcWallet,
} from '@reown/appkit';
import { compact } from 'lodash-es';
import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { useConnections } from 'wagmi';

import { ClickOrigin, NetworkType } from '@/constants/enum.js';
import { getFilteredConnectors } from '@/helpers/getFilteredConnectors.js';
import { networkTypeToChainNamespace } from '@/helpers/networkTypeToChainNamespace.js';
import type { ChainNamespace, ConnectorWithProvider } from '@/types/utility.js';

interface WalletConnectState {
    connectors: ConnectorWithProvider[];
    featuredWallets: WcWallet[];
    chainState: Map<ChainNamespace, ChainAdapter>;
}

interface WalletConnectContext extends WalletConnectState {
    loading: boolean;
    connectedId: Array<{ networkType: NetworkType; id: string }>;
    chainNamespace: ChainNamespace | null;

    origin: ClickOrigin;
    setOrigin: (origin: ClickOrigin) => void;

    customTitle: string | null;
    setCustomTitle: (title: string | null) => void;

    networkType: NetworkType | null;
    setNetworkType: (networkType?: NetworkType) => void;
    unsetNetworkType: () => void;
}

function createEmptyWalletConnectState(): WalletConnectState {
    return {
        connectors: getFilteredConnectors(),
        featuredWallets: CoreApiController.state?.featured || [],
        chainState: CoreChainController.state.chains,
    };
}

async function setupApi() {
    await Promise.allSettled([
        CoreApiController.fetchFeaturedWallets(),
        CoreApiController.fetchRecommendedWallets(),
        CoreApiController.fetchConnectorImages(),
        CoreApiController.fetchNetworkImages(),
    ]);
}

function useWalletConnectContext(initialState?: WalletConnectContext): WalletConnectContext {
    const connections = useConnections();
    const [value, setValue] = useState<WalletConnectState>(initialState ?? createEmptyWalletConnectState());

    const [origin, setOrigin] = useState<ClickOrigin>(ClickOrigin.Others);
    const [customTitle, setCustomTitle] = useState<string | null>(null);

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
        const unsubscribeChainState = CoreChainController.subscribeKey('chains', (chains) => {
            setValue((prev) => ({ ...prev, chainState: chains }));
        });

        return () => {
            unsubscribeInjected();
            unsubscribeFeatured();
            unsubscribeChainState();
        };
    }, []);

    // setup api
    useEffect(() => {
        setupApi().finally(() => {
            setLoading(false);
        });
    }, []);

    const solanaWalletName = value.chainState.get('solana')?.accountState?.connectedWalletInfo?.name;
    const connectedId = compact([
        ...connections.map((x) => ({ networkType: NetworkType.Ethereum, id: x.connector.id })),
        solanaWalletName ? { networkType: NetworkType.Solana, id: solanaWalletName } : null,
    ]);

    return {
        chainState: value.chainState,
        connectors: getFilteredConnectors(value.connectors, value.featuredWallets),
        featuredWallets: value.featuredWallets,

        loading,
        connectedId,
        chainNamespace: networkType ? networkTypeToChainNamespace(networkType) : null,

        origin,
        setOrigin,

        customTitle,
        setCustomTitle,

        networkType,
        setNetworkType: (networkType?: NetworkType) => setNetworkType(networkType ?? null),
        unsetNetworkType: () => setNetworkType(null),
    };
}

export const WalletConnectContext = createContainer(useWalletConnectContext);
