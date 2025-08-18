import {
    CoreChainController,
    CoreConnectorController,
    CoreHelperUtil,
    CoreRouterController,
    type WcWallet,
} from '@reown/appkit';
import urlcat from 'urlcat';

import { WalletId } from '@/constants/reown.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';
import type { ConnectorWithProvider } from '@/types/utility.js';

function redirectSolanaLinkInNeed(walletId: WalletId) {
    if (CoreChainController.state?.activeChain !== 'solana') return;

    const href = location.href;
    const encodedHref = encodeURIComponent(href);

    if (walletId === WalletId.Phantom && !('phantom' in window)) {
        const protocol = href.startsWith('https') ? 'https' : 'http';
        const host = href.split('/')[2];
        const encodedRef = encodeURIComponent(`${protocol}://${host}`);

        location.href = `https://phantom.app/ul/browse/${encodedHref}?ref=${encodedRef}`;
    } else if (walletId === WalletId.CoinBase && !('coinbaseSolana' in window)) {
        location.href = `https://go.cb-w.com/dapp?cb_url=${encodedHref}`;
    }
}

export function selectWallet(wallet: WcWallet) {
    const connector = CoreConnectorController.getConnector(wallet.id, wallet.rdns);

    if (CoreChainController.state?.activeChain === 'solana') {
        redirectSolanaLinkInNeed(wallet.id as WalletId);
    }

    if (connector) {
        CoreRouterController.state.data = { connector };
        walletRouter.navigate({ to: urlcat('/connecting', { name: encodeURIComponent(connector.name || '') }) });
    } else {
        CoreRouterController.state.data = { wallet };
        walletRouter.navigate({ to: urlcat('/connecting-wc', { name: encodeURIComponent(wallet.name || '') }) });
    }
}

export function selectConnector(connector: ConnectorWithProvider) {
    if (connector.id === 'walletConnect') {
        const path = CoreHelperUtil.isMobile() ? '/all-wallets' : '/connecting-wc';
        walletRouter.navigate({ to: urlcat(path, { name: encodeURIComponent(connector.name || '') }) });
    } else {
        CoreRouterController.state.data = { connector };
        walletRouter.navigate({
            to: urlcat('/connecting', {
                name: encodeURIComponent(connector.name || ''),
            }),
        });
    }
}
