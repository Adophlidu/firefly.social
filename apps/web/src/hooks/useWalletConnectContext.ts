import { CoreApiController } from '@reown/appkit';
import { useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';

import { ClickOrigin, type NetworkType } from '@/constants/enum.js';
import { networkTypeToChainNamespace } from '@/helpers/networkTypeToChainNamespace.js';
import { type ChainNamespace } from '@/types/utility.js';

interface WalletConnectContext {
    loading: boolean;
    chainNamespace: ChainNamespace | null;

    origin: ClickOrigin;
    setOrigin: (origin: ClickOrigin) => void;

    customTitle: string | null;
    setCustomTitle: (title: string | null) => void;

    networkType: NetworkType | null;
    setNetworkType: (networkType?: NetworkType) => void;
    unsetNetworkType: () => void;
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
    const [origin, setOrigin] = useState<ClickOrigin>(ClickOrigin.Others);
    const [customTitle, setCustomTitle] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [networkType, setNetworkType] = useState<NetworkType | null>(null);

    // setup api
    useEffect(() => {
        setupApi().finally(() => {
            setLoading(false);
        });
    }, []);

    return {
        loading,
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
