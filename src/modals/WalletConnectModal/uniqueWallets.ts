import {
    CoreConnectorController,
    CoreHelperUtil,
    CoreOptionsController,
    CoreStorageUtil,
    type WcWallet,
} from '@reown/appkit';
import { compact } from 'lodash-es';

function filterOutDuplicatesByRDNS(wallets: WcWallet[]) {
    const connectors = CoreOptionsController.state.enableEIP6963 ? CoreConnectorController.state.connectors : [];
    const recent = CoreStorageUtil.getRecentWallets();

    const records = [
        ...compact(
            CoreConnectorController.state.connectors
                .filter((x) => x.type === 'MULTI_CHAIN')
                .map((x) => x.connectors?.find((y) => !!y.info?.rdns)?.info?.rdns),
        ),
        ...(connectors.map((connector) => connector.info?.rdns).filter(Boolean) as string[]),
        ...(recent.map((wallet) => wallet.rdns).filter(Boolean) as string[]),
    ];
    if (records.includes('io.metamask.mobile') && CoreHelperUtil.isMobile()) {
        const index = records.indexOf('io.metamask.mobile');
        records[index] = 'io.metamask';
    }

    return wallets.filter((wallet) => !records.includes(String(wallet?.rdns)));
}

function filterOutDuplicatesByIds(wallets: WcWallet[]) {
    const connectors = CoreConnectorController.state.connectors.filter(
        (connector) => connector.type === 'ANNOUNCED' || connector.type === 'INJECTED',
    );
    const recent = CoreStorageUtil.getRecentWallets();

    const allIds = [...connectors.map((connector) => connector.explorerId), ...recent.map((wallet) => wallet.id)];

    return wallets.filter((wallet) => !allIds.includes(wallet?.id));
}

export function uniqueWallets(wallets: WcWallet[]) {
    return filterOutDuplicatesByIds(filterOutDuplicatesByRDNS(wallets));
}
