import type { NetworkType } from '@dimensiondev/enums';
import { ClickOrigin } from '@dimensiondev/enums';
import { ApiController as CoreApiController } from '@reown/appkit-controllers';
import { useEffect, useRef, useState } from 'react';
import { createContainer } from 'unstated-next';

import { networkTypeToChainNamespace } from '@/helpers/networkTypeToChainNamespace.js';
import type { ChainNamespace } from '@/types/utility.js';

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

    /**
     * Ref, not state: onConnect is set when the modal opens and read when the
     * wallet connects. It must NOT trigger a re-render (a setState here during the
     * open event overlaps the caller's render and trips React's
     * "cannot update a component while rendering a different component" guard).
     */
    onConnectRef: React.MutableRefObject<
        ((networkType: NetworkType, caipAddress: string) => Promise<void> | void) | null
    >;
}

async function setupApi() {
    await Promise.allSettled([
        CoreApiController.fetchFeaturedWallets(),
        CoreApiController.fetchRecommendedWallets(),
        CoreApiController.fetchConnectorImages(),
        CoreApiController.fetchNetworkImages(),
    ]);
}

function useWalletConnectContext(): WalletConnectContext {
    const [origin, setOrigin] = useState<ClickOrigin>(ClickOrigin.Others);
    const [customTitle, setCustomTitle] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [networkType, setNetworkType] = useState<NetworkType | null>(null);
    const onConnectRef = useRef<((networkType: NetworkType, caipAddress: string) => Promise<void> | void) | null>(null);

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

        onConnectRef,
    };
}

export const WalletConnectContext = createContainer(useWalletConnectContext);
