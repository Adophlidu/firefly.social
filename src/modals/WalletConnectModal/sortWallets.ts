import { safeUnreachable } from '@dimensiondev/utils';

import type { AppkitConnectorItem, AppkitWalletItem } from '@/hooks/appkit/useAppkitWalletList.js';

type AppkitWallet = AppkitConnectorItem | AppkitWalletItem;

const orderMapByName: Record<string, number> = {
    metamask: 1,
    'rabby wallet': 2,
    'okx wallet': 3,
    phantom: 4,
    'coinbase wallet': 5,
    solflare: 6,
    walletconnect: 7,
};
const orderMapByRdns: Record<string, number> = {
    'io.metamask': 1,
    'io.rabby': 2,
    'com.okex.wallet': 3,
    'app.phantom': 4,
    'com.coinbase.wallet': 5,
};

function getName(item: AppkitWallet) {
    switch (item.kind) {
        case 'connector':
            return item.connector.name;
        case 'wallet':
            return item.wallet.name;
        default:
            safeUnreachable(item);
            return;
    }
}
function getRdns(item: AppkitWallet) {
    if (item.kind === 'wallet') return item.wallet.rdns;

    const connectorRdns = item.connector.info?.rdns;
    if (connectorRdns) return connectorRdns;

    if (item.subtype === 'multiChain') {
        return item.connector.connectors?.find((x) => !!x.info?.rdns)?.info?.rdns;
    }

    return;
}
function getSortOrder(item: AppkitWallet) {
    const rdns = getRdns(item);
    if (rdns && orderMapByRdns[rdns]) return orderMapByRdns[rdns];

    const lowerCaseName = getName(item)?.toLowerCase();
    if (lowerCaseName && orderMapByName[lowerCaseName]) return orderMapByName[lowerCaseName];

    return;
}

export function sortWallets(wallets: AppkitWallet[]) {
    const copied = [...wallets];

    copied.sort((a, b) => {
        const orderA = getSortOrder(a);
        const orderB = getSortOrder(b);
        if (!orderA || !orderB) return 0;

        return orderA - orderB;
    });

    return copied;
}
