import type { ConnectorWithProviders, WcWallet } from '@reown/appkit';
import {
    ApiController as CoreApiController,
    ConnectionController as CoreConnectionController,
    CoreHelperUtil,
    OptionsController as CoreOptionsController,
    StorageUtil as CoreStorageUtil,
} from '@reown/appkit-controllers';

import { WalletUtil } from '@/libs/appkit/WalletUtil.js';

function isLowerCaseMatch(str1?: string, str2?: string) {
    return str1?.toLowerCase() === str2?.toLowerCase();
}

export const ConnectorUtil = {
    getConnectorsByType(connectors: ConnectorWithProviders[], recommended: WcWallet[], featured: WcWallet[]) {
        const { customWallets } = CoreOptionsController.state;
        const recent = CoreStorageUtil.getRecentWallets();

        const filteredRecommended = WalletUtil.filterOutDuplicateWallets(recommended);
        const filteredFeatured = WalletUtil.filterOutDuplicateWallets(featured);

        const multiChain = connectors.filter((connector) => connector.type === 'MULTI_CHAIN');
        const announced = connectors.filter((connector) => connector.type === 'ANNOUNCED');
        const injected = connectors.filter((connector) => connector.type === 'INJECTED');
        const external = connectors.filter((connector) => connector.type === 'EXTERNAL');

        return {
            custom: customWallets,
            recent,
            external,
            multiChain,
            announced,
            injected,
            recommended: filteredRecommended,
            featured: filteredFeatured,
        };
    },

    showConnector(connector: ConnectorWithProviders) {
        const rdns = connector.info?.rdns;

        const isRDNSExcluded =
            Boolean(rdns) &&
            CoreApiController.state.excludedWallets.some((wallet) => Boolean(wallet.rdns) && wallet.rdns === rdns);

        const isNameExcluded =
            Boolean(connector.name) &&
            CoreApiController.state.excludedWallets.some((wallet) => isLowerCaseMatch(wallet.name, connector.name));

        if (connector.type === 'INJECTED') {
            const isBrowserWallet = connector.name === 'Browser Wallet';

            if (isBrowserWallet) {
                if (!CoreHelperUtil.isMobile()) {
                    return false;
                }

                if (CoreHelperUtil.isMobile() && !rdns && !CoreConnectionController.checkInstalled()) {
                    return false;
                }
            }

            if (isRDNSExcluded || isNameExcluded) {
                return false;
            }
        }

        if ((connector.type === 'ANNOUNCED' || connector.type === 'EXTERNAL') && (isRDNSExcluded || isNameExcluded)) {
            return false;
        }

        return true;
    },
    sortConnectorsByExplorerWallet(connectors: ConnectorWithProviders[]) {
        return [...connectors].sort((a, b) => {
            if (a.explorerWallet && b.explorerWallet) {
                return (a.explorerWallet.order ?? 0) - (b.explorerWallet.order ?? 0);
            }

            if (a.explorerWallet) {
                return -1;
            }

            if (b.explorerWallet) {
                return 1;
            }

            return 0;
        });
    },
    processConnectorsByType(connectors: ConnectorWithProviders[], shouldFilter = true): ConnectorWithProviders[] {
        const sorted = ConnectorUtil.sortConnectorsByExplorerWallet([...connectors]);

        return shouldFilter ? sorted.filter(ConnectorUtil.showConnector) : sorted;
    },
};
