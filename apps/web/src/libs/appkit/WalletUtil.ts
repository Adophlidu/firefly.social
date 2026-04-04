import {
    CoreConnectorController,
    CoreHelperUtil,
    CoreOptionsController,
    CoreStorageUtil,
    type WcWallet,
} from '@reown/appkit';

export const WalletUtil = {
    filterOutDuplicatesByRDNS(wallets: WcWallet[]) {
        const connectors = CoreOptionsController.state.enableEIP6963 ? CoreConnectorController.state.connectors : [];
        const recent = CoreStorageUtil.getRecentWallets();

        const connectorRDNSs = connectors.map((connector) => connector.info?.rdns).filter(Boolean) as string[];

        const recentRDNSs = recent.map((wallet) => wallet.rdns).filter(Boolean) as string[];
        const allRDNSs = connectorRDNSs.concat(recentRDNSs);
        if (allRDNSs.includes('io.metamask.mobile') && CoreHelperUtil.isMobile()) {
            const index = allRDNSs.indexOf('io.metamask.mobile');
            allRDNSs[index] = 'io.metamask';
        }

        const filtered = wallets.filter((wallet) => {
            // Check RDNS match first
            if (wallet?.rdns && allRDNSs.includes(String(wallet.rdns))) {
                return false;
            }

            // Some wallets don't have RDNS, so we need to check if the name matches a connector name
            if (!wallet?.rdns) {
                const hasMatchingConnectorName = connectors.some((connector) => connector.name === wallet.name);
                if (hasMatchingConnectorName) {
                    return false;
                }
            }

            return true;
        });

        return filtered;
    },

    filterOutDuplicatesByIds(wallets: WcWallet[]) {
        const connectors = CoreConnectorController.state.connectors.filter(
            (connector) =>
                connector.type === 'ANNOUNCED' || connector.type === 'INJECTED' || connector.type === 'MULTI_CHAIN',
        );
        const recent = CoreStorageUtil.getRecentWallets();

        const connectorIds = connectors.map(
            (connector) => connector.explorerId || connector.explorerWallet?.id || connector.id,
        );

        const recentIds = recent.map((wallet) => wallet.id);

        const allIds = connectorIds.concat(recentIds);

        const filtered = wallets.filter((wallet) => !allIds.includes(wallet?.id));

        return filtered;
    },

    filterOutDuplicateWallets(wallets: WcWallet[]) {
        const uniqueByRDNS = this.filterOutDuplicatesByRDNS(wallets);
        const uniqueWallets = this.filterOutDuplicatesByIds(uniqueByRDNS);

        return uniqueWallets;
    },
};
