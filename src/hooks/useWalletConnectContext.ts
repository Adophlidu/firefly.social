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
import type { ChainNamespace, ConnectorWithProvider } from '@/types/index.js';

interface WalletConnectState {
    connectors: ConnectorWithProvider[];
    featuredWallets: WcWallet[];
    chainState: Map<ChainNamespace, ChainAdapter>;
}

interface WalletConnectContext extends WalletConnectState {
    loading: boolean;
    connectedId: string[];
    chainNamespace: ChainNamespace | null;

    origin: ClickOrigin;
    setOrigin: (origin: ClickOrigin) => void;

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

function useWalletConnectContext(initialState?: WalletConnectContext): WalletConnectContext {
    const connections = useConnections();
    const [value, setValue] = useState<WalletConnectState>(initialState ?? createEmptyWalletConnectState());

    const [origin, setOrigin] = useState<ClickOrigin>(ClickOrigin.Others);

    const [loading, setLoading] = useState(true);
    const [networkType, setNetworkType] = useState<NetworkType | null>(null);

    // subscribe events
    useEffect(() => {
        const unsubscribeInjected = CoreConnectorController.subscribeKey('connectors', (connectors) => {
            setValue((prev) => ({ ...prev, connectors: getFilteredConnectors(connectors) }));
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

    const connectedId = compact([
        ...connections.map((x) => x.connector.id),
        value.chainState.get('solana')?.accountState?.connectedWalletInfo?.name,
    ]);

    return {
        chainState: value.chainState,
        connectors: value.connectors,
        featuredWallets: value.featuredWallets,

        loading,
        connectedId,
        chainNamespace: networkType ? networkTypeToChainNamespace(networkType) : null,

        origin,
        setOrigin,

        networkType,
        setNetworkType: (networkType?: NetworkType) => setNetworkType(networkType ?? null),
        unsetNetworkType: () => setNetworkType(null),
    };
}

export const WalletConnectContext = createContainer(useWalletConnectContext);
