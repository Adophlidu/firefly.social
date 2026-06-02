/* cspell:disable */

import type { ChainControllerState, WcWallet } from '@reown/appkit';
import {
    ChainController as CoreChainController,
    ConnectorController as CoreConnectorController,
    RouterController as CoreRouterController,
} from '@reown/appkit-controllers';
import urlcat from 'urlcat';

import { IS_MOBILE_DEVICE } from '@/constants/browser.js';
import { walletConnectId, WalletId } from '@/constants/reown.js';
import { findConnectorByWallet } from '@/modals/WalletConnectModal/findConnectorByWallet.js';
import { walletRouter } from '@/modals/WalletConnectModal/routes.js';

const CUSTOM_DEEPLINK_WALLETS = {
    PHANTOM: {
        id: 'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393',
        url: 'https://phantom.app',
    },
    SOLFLARE: {
        id: '1ca0bdd4747578705b1939af023d120677c64fe6ca76add81fda36e350605e79',
        url: 'https://solflare.com',
    },
    COINBASE: {
        id: 'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
        url: 'https://go.cb-w.com',
    },
    /*
     * Got details from their npm package:
     * https://www.npmjs.com/package/@binance/w3w-utils?activeTab=code
     * https://developers.binance.com/docs/binance-w3w/evm-compatible-provider#getdeeplink
     */
    BINANCE: {
        id: '2fafea35bb471d22889ccb49c08d99dd0a18a37982602c33f696a5723934ba25',
        appId: 'yFK5FCqYprrXDiVFbhyRx7',
        deeplink: 'bnc://app.binance.com/mp/app',
        url: 'https://app.binance.com/en/download',
    },
};

function redirectSolanaLinkInNeed(id: string, namespace: ChainControllerState['activeChain']) {
    const href = window.location.href;
    const encodedHref = encodeURIComponent(href);

    if (id === CUSTOM_DEEPLINK_WALLETS.PHANTOM.id && !('phantom' in window)) {
        const protocol = href.startsWith('https') ? 'https' : 'http';
        const host = href.split('/')[2];
        const encodedRef = encodeURIComponent(`${protocol}://${host}`);

        window.location.href = `${CUSTOM_DEEPLINK_WALLETS.PHANTOM.url}/ul/browse/${encodedHref}?ref=${encodedRef}`;
    }

    if (id === CUSTOM_DEEPLINK_WALLETS.SOLFLARE.id && !('solflare' in window)) {
        window.location.href = `${CUSTOM_DEEPLINK_WALLETS.SOLFLARE.url}/ul/v1/browse/${encodedHref}?ref=${encodedHref}`;
    }

    if (namespace === 'solana') {
        if (id === CUSTOM_DEEPLINK_WALLETS.COINBASE.id && !('coinbaseSolana' in window)) {
            window.location.href = `${CUSTOM_DEEPLINK_WALLETS.COINBASE.url}/dapp?cb_url=${encodedHref}`;
        }
    }

    /*
     * Binance Web3 Wallet doesn't support WalletConnect for Bitcoin.
     * For now we use their deeplink to open the in-app browser instead.
     */
    if (namespace === 'bip122') {
        if (id === CUSTOM_DEEPLINK_WALLETS.BINANCE.id && !('binancew3w' in window)) {
            const activeCaipNetwork = CoreChainController.state.activeCaipNetwork;

            const startPagePath = window.btoa('/pages/browser/index');
            const startPageQuery = window.btoa(`url=${encodedHref}&defaultChainId=${activeCaipNetwork?.id ?? 1}`);

            const deeplink = new URL(CUSTOM_DEEPLINK_WALLETS.BINANCE.deeplink);

            deeplink.searchParams.set('appId', CUSTOM_DEEPLINK_WALLETS.BINANCE.appId);
            deeplink.searchParams.set('startPagePath', startPagePath);
            deeplink.searchParams.set('startPageQuery', startPageQuery);

            const universalLink = new URL(CUSTOM_DEEPLINK_WALLETS.BINANCE.url);

            universalLink.searchParams.set('_dp', window.btoa(deeplink.toString()));

            window.location.href = universalLink.toString();
        }
    }
}

export function selectWallet(wallet: WcWallet) {
    const connector = findConnectorByWallet(wallet);
    const walletName = encodeURIComponent(wallet.name || '');

    if (connector) {
        if (wallet.id === WalletId.Phantom && IS_MOBILE_DEVICE) {
            // Phantom on mobile should use WC flow to open the wallet app, not external injected detection view.
            if (connector.type !== 'INJECTED') {
                const wcConnector = CoreConnectorController.state.connectors.find((x) => x.id === walletConnectId);
                if (wcConnector) {
                    CoreConnectorController.setActiveConnector(wcConnector);
                }
                CoreRouterController.state.data = { wallet };
                walletRouter.navigate({ to: urlcat('/connecting-wc', { name: walletName }) });
                return;
            }
            // Let AppKit handle WC mobile deep-link with wcUri; only keep custom deeplink for injected Phantom.
            redirectSolanaLinkInNeed(connector.explorerId || wallet.id, 'solana');
        }

        CoreRouterController.state.data = { connector, wallet };
        walletRouter.navigate({ to: urlcat('/connecting', { name: encodeURIComponent(connector.name || '') }) });
    } else {
        CoreRouterController.state.data = { wallet };
        walletRouter.navigate({ to: urlcat('/connecting-wc', { name: walletName }) });
    }
}
