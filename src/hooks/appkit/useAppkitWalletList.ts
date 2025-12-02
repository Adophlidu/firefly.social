import {
    type ConnectorWithProviders,
    CoreApiController,
    CoreConnectorController,
    CoreHelperUtil,
    type WcWallet,
} from '@reown/appkit';
import { useEffect, useMemo, useState } from 'react';

import { walletConnectId } from '@/constants/reown.js';
import { ConnectorUtil } from '@/libs/appkit/ConnectorUtil.js';

export interface AppkitConnectorItem {
    kind: 'connector';
    subtype: 'injected' | 'announced' | 'multiChain' | 'external' | 'walletConnect';
    connector: ConnectorWithProviders;
}
export interface AppkitWalletItem {
    kind: 'wallet';
    subtype: 'featured' | 'recommended' | 'custom' | 'recent';
    wallet: WcWallet;
}

export function useAppkitWalletList() {
    const [connectors, setConnectors] = useState(CoreConnectorController.state.connectors);
    const [recommended, setRecommended] = useState(CoreApiController.state.recommended);
    const [featured, setFeatured] = useState(CoreApiController.state.featured);

    // state listener
    useEffect(() => {
        const unsubscribes = [
            CoreConnectorController.subscribeKey('connectors', (val) => setConnectors(val)),
            CoreApiController.subscribeKey('recommended', (val) => setRecommended(val)),
            CoreApiController.subscribeKey('featured', (val) => setFeatured(val)),
        ];

        return () => {
            unsubscribes.forEach((unsubscribe) => unsubscribe());
        };
    }, []);

    return useMemo(() => {
        const items: Array<AppkitConnectorItem | AppkitWalletItem> = [];

        const byType = ConnectorUtil.getConnectorsByType(connectors, recommended, featured);
        const announced = ConnectorUtil.processConnectorsByType(
            byType.announced.filter((c) => c.id !== walletConnectId),
        );
        const injected = ConnectorUtil.processConnectorsByType(byType.injected);
        const multiChain = ConnectorUtil.processConnectorsByType(
            byType.multiChain.filter((c) => c.name !== 'WalletConnect'),
            false,
        );

        multiChain.forEach((c) => items.push({ kind: 'connector', subtype: 'multiChain', connector: c }));
        announced.forEach((c) => items.push({ kind: 'connector', subtype: 'announced', connector: c }));
        injected.forEach((c) => items.push({ kind: 'connector', subtype: 'injected', connector: c }));
        byType.featured.forEach((w) => items.push({ kind: 'wallet', subtype: 'featured', wallet: w }));

        const isMobile = CoreHelperUtil.isMobile();
        const wcConnector = connectors.find((c) => c.id === walletConnectId);
        if (!isMobile && wcConnector) {
            items.push({ kind: 'connector', subtype: 'walletConnect', connector: wcConnector });
        }

        return items;
    }, [connectors, recommended, featured]);
}
