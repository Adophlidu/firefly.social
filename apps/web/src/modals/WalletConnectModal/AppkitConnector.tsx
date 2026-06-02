import ScanIcon from '@dimensiondev/assets/scan.svg';
import {
    AssetController as CoreAssetController,
    AssetUtil as CoreAssetUtil,
    ConnectionController as CoreConnectionController,
    ConnectorController as CoreConnectorController,
    CoreHelperUtil,
    RouterController as CoreRouterController,
} from '@reown/appkit-controllers';
import { memo, useEffect, useState } from 'react';
import urlcat from 'urlcat';

import { walletConnectIcon, walletConnectId, WalletId } from '@/constants/reown.js';
import type { AppkitConnectorItem } from '@/hooks/appkit/useAppkitWalletList.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';
import { WalletItem } from '@/modals/WalletConnectModal/WalletItem.js';

interface AppkitConnectorProps {
    item: AppkitConnectorItem;
}

function getConnectorNamespaces(item: AppkitConnectorItem) {
    const { subtype, connector } = item;
    if (subtype === 'walletConnect') {
        return [];
    }

    return item.subtype === 'multiChain'
        ? connector.connectors?.map((c) => c.chain)
        : connector.chain
          ? [connector.chain]
          : [];
}

function onConnectorClick(item: AppkitConnectorItem) {
    const { connector, subtype } = item;
    const connectorName = connector.name ? encodeURIComponent(connector.name) : undefined;
    const isMobile = CoreHelperUtil.isMobile();
    const isPhantom =
        connector.explorerId === WalletId.Phantom ||
        connector.explorerWallet?.id === WalletId.Phantom ||
        connector.info?.rdns === 'app.phantom' ||
        (connector.name || '').toLowerCase() === 'phantom';

    if (isMobile && isPhantom && subtype !== 'walletConnect') {
        const wcConnector = CoreConnectorController.state.connectors.find((x) => x.id === walletConnectId);
        if (wcConnector) {
            CoreConnectorController.setActiveConnector(wcConnector);
        }
        if (connector.explorerWallet) {
            CoreRouterController.state.data = { wallet: connector.explorerWallet, redirectView: undefined };
        } else {
            CoreRouterController.state.data = { redirectView: undefined };
        }
        walletRouter.navigate({
            to: urlcat('/connecting-wc', { name: connectorName }),
        });
        return;
    }

    if (subtype === 'walletConnect') {
        CoreConnectorController.setActiveConnector(connector);
        if (isMobile) {
            walletRouter.navigate({ to: '/all-wallets' });
        } else {
            CoreRouterController.state.data = { redirectView: undefined };
            walletRouter.navigate({
                to: urlcat('/connecting-wc', { name: connectorName }),
            });
        }

        return;
    }

    if (subtype === 'multiChain') {
        CoreConnectorController.setActiveConnector(connector);
        CoreRouterController.state.data = { redirectView: undefined };
        walletRouter.navigate({ to: '/multiple-chain' });
        return;
    }

    if (subtype === 'injected') {
        CoreConnectorController.setActiveConnector(connector);
        CoreRouterController.state.data = {
            connector,
            redirectView: undefined,
            wallet: connector.explorerWallet,
        };
        walletRouter.navigate({ to: urlcat('/connecting', { name: connectorName }) });
        return;
    }

    if (subtype === 'announced') {
        if (connector.id === walletConnectId) {
            if (CoreHelperUtil.isMobile()) {
                walletRouter.navigate({ to: '/all-wallets' });
            } else {
                CoreRouterController.state.data = { redirectView: undefined };
                walletRouter.navigate({
                    to: urlcat('/connecting-wc', { name: connectorName }),
                });
            }

            return;
        }

        CoreRouterController.state.data = {
            connector,
            redirectView: undefined,
            wallet: connector.explorerWallet,
        };
        walletRouter.navigate({
            to: urlcat('/connecting', {
                name: connectorName,
            }),
        });

        return;
    }

    CoreRouterController.state.data = {
        connector,
        redirectView: undefined,
    };
    walletRouter.navigate({
        to: urlcat('/connecting', {
            name: connectorName,
        }),
    });
}

export const AppkitConnector = memo<AppkitConnectorProps>(function AppkitConnector({ item }) {
    const [connections, setConnections] = useState(CoreConnectionController.state.connections);
    const [connectorImages, setConnectorImages] = useState(CoreAssetController.state.connectorImages);

    useEffect(() => {
        const unsubscribes = [
            CoreConnectionController.subscribeKey('connections', (val) => setConnections(val)),
            CoreAssetController.subscribeKey('connectorImages', (val) => setConnectorImages(val)),
        ];

        return () => {
            unsubscribes.forEach((unsubscribe) => unsubscribe());
        };
    }, []);

    const connector = item.connector;
    const imageSrc = CoreAssetUtil.getConnectorImage(connector) || connectorImages[connector?.imageId ?? ''];
    const connectionsByNamespace = connections.get(connector.chain) ?? [];
    const isAlreadyConnected = connectionsByNamespace.some(
        (c) => c.connectorId?.toLowerCase() === connector.id?.toLowerCase(),
    );

    const hasWcConnection = CoreConnectionController.hasAnyConnection(walletConnectId);
    const isWalletConnect = item.subtype === 'walletConnect';
    const disabled = isWalletConnect || item.subtype === 'external' ? hasWcConnection : false;

    return (
        <WalletItem
            data-wallet-type={item.subtype}
            icon={isWalletConnect ? walletConnectIcon : imageSrc}
            name={connector.name}
            installed
            disabled={disabled}
            chains={getConnectorNamespaces(item) || []}
            connected={isAlreadyConnected}
            onClick={() => onConnectorClick(item)}
            tagIcon={isWalletConnect ? <ScanIcon width={20} height={20} className="text-main" /> : null}
        />
    );
});
