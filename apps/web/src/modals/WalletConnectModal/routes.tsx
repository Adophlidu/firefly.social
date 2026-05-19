import { NetworkType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    lazyRouteComponent,
} from '@tanstack/react-router';

import { WalletConnectContext } from '@/hooks/useWalletConnectContext.js';
import { DownloadView } from '@/modals/WalletConnectModal/DownloadView.js';
import { RootView } from '@/modals/WalletConnectModal/RootView.js';
import { WalletListView } from '@/modals/WalletConnectModal/WalletListView.js';

const rootRoute = createRootRoute({
    component: RootView,
});

function MainTitle() {
    const { networkType, customTitle } = WalletConnectContext.useContainer();
    if (customTitle) return customTitle;
    if (!networkType) return <Trans>Connect Wallet</Trans>;

    switch (networkType) {
        case NetworkType.Ethereum:
            return <Trans>Connect Ethereum Wallet</Trans>;
        case NetworkType.Solana:
            return <Trans>Connect Solana Wallet</Trans>;
        default:
            safeUnreachable(networkType);
            return <Trans>Connect Wallet</Trans>;
    }
}

const mainRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: WalletListView,
    path: '/main',
    beforeLoad: () => {
        return {
            title: <MainTitle />,
        };
    },
});

const connectingView = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./ConnectingView.js')),
    path: '/connecting',
    beforeLoad: (ctx) => {
        const connectorName = 'name' in ctx.search ? ctx.search.name : '';
        return {
            title: decodeURIComponent((connectorName || '') as string) || <Trans>Connecting</Trans>,
        };
    },
});

const connectingWcView = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./ConnectingWcView.js')),
    path: '/connecting-wc',
    beforeLoad: (ctx) => {
        const connectorName = 'name' in ctx.search ? ctx.search.name : '';
        return {
            title: decodeURIComponent((connectorName || '') as string) || <Trans>Connecting</Trans>,
        };
    },
});

const allWalletsView = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./AllWalletsView.js')),
    path: '/all-wallets',
    beforeLoad: () => {
        return {
            title: <Trans>All Wallets</Trans>,
        };
    },
});

const downloadView = createRoute({
    getParentRoute: () => rootRoute,
    component: DownloadView,
    path: '/download',
    beforeLoad: (ctx) => {
        const connectorName = 'name' in ctx.search ? ctx.search.name : '';
        return {
            title: connectorName ? (
                <Trans>Get {decodeURIComponent(connectorName as string)}</Trans>
            ) : (
                <Trans>Download Wallet</Trans>
            ),
        };
    },
});

const multipleChainView = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./MultipleChainView.js')),
    path: '/multiple-chain',
    beforeLoad: () => {
        return {
            title: <Trans>Select Chain</Trans>,
        };
    },
});

const routeTree = rootRoute.addChildren([
    mainRoute,
    connectingView,
    connectingWcView,
    allWalletsView,
    downloadView,
    multipleChainView,
]);

function createWalletRouter(initialEntries: string[] = ['/main']) {
    const memoryHistory = createMemoryHistory({
        initialEntries,
    });

    return createRouter({
        routeTree,
        history: memoryHistory,
        defaultPendingMinMs: 200,
        defaultPendingComponent: WalletListView,
    });
}

export const walletRouter = createWalletRouter();
