import { compact } from 'lodash-es';
import { useMemo } from 'react';

import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import {
    AllWalletsEntry,
    AnnouncedWallets,
    FeaturedWallets,
    InjectedWallets,
    MultipleChainWallets,
    WalletConnect,
} from '@/modals/WalletConnectModal/WalletList.js';

export function WalletListView() {
    const { connectors, featuredWallets, chainNamespace } = WalletConnectContext.useContainer();

    const filteredConnectors = useMemo(() => {
        if (!chainNamespace) return connectors;

        return compact(
            connectors.map((connector) => {
                switch (connector.type) {
                    case 'MULTI_CHAIN':
                        const validConnector = connector.connectors?.find((x) => x.chain === chainNamespace);
                        return validConnector ? { ...connector, connectors: [validConnector] } : null;
                    case 'ANNOUNCED':
                    case 'INJECTED':
                        return connector.chain === chainNamespace ? connector : null;
                    default:
                        return null;
                }
            }),
        );
    }, [connectors, chainNamespace]);

    return (
        <div className="space-y-2">
            <MultipleChainWallets connectors={filteredConnectors} />
            <InjectedWallets connectors={filteredConnectors} />
            <AnnouncedWallets connectors={filteredConnectors} />
            <FeaturedWallets wallets={featuredWallets} />
            <WalletConnect connectors={connectors} />
            <AllWalletsEntry />
        </div>
    );
}
