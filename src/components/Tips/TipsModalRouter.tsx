import { Trans } from '@lingui/react/macro';
import { createMemoryHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import { Loading } from '@/components/Loading.js';
import { NoAvailableWallet } from '@/components/Tips/NoAvailableWallet.js';
import { RootView } from '@/components/Tips/views/RootView.js';
import { SuccessView } from '@/components/Tips/views/SuccessView.js';
import { TipsMainView } from '@/components/Tips/views/TipsMainView.js';
import { TipsRecipientListView } from '@/components/Tips/views/TipsRecipientListView.js';
import { TokenSelectorView } from '@/components/Tips/views/TokenSelectorView.js';

export enum TipsRoutePath {
    TIPS = '/tips',
    NO_AVAILABLE_WALLET = '/no-available-wallet',
    SELECT_TOKEN = '/select-token',
    SELECT_RECIPIENT = '/select-recipient',
    LOADING = '/',
    SUCCESS = '/success',
}

const tipsRootRoute = createRootRoute({
    component: RootView,
});

const noAvailableWalletRoute = createRoute({
    getParentRoute: () => tipsRootRoute,
    path: TipsRoutePath.NO_AVAILABLE_WALLET,
    component: NoAvailableWallet,
});

const tipsRoute = createRoute({
    getParentRoute: () => tipsRootRoute,
    path: TipsRoutePath.TIPS,
    component: TipsMainView,
    beforeLoad: () => {
        return {
            title: <Trans>Tip</Trans>,
        };
    },
});

const tokenSelectRoute = createRoute({
    getParentRoute: () => tipsRootRoute,
    path: TipsRoutePath.SELECT_TOKEN,
    component: TokenSelectorView,
    beforeLoad: () => {
        return {
            title: <Trans>Select Token</Trans>,
        };
    },
});

const recipientSelectRoute = createRoute({
    getParentRoute: () => tipsRootRoute,
    path: TipsRoutePath.SELECT_RECIPIENT,
    component: TipsRecipientListView,
    beforeLoad: () => {
        return {
            title: <Trans>Choose Wallet</Trans>,
        };
    },
});

const loadingRoute = createRoute({
    getParentRoute: () => tipsRootRoute,
    path: TipsRoutePath.LOADING,
    component: () => <Loading className="!min-h-[156px]" />,
});

const successRoute = createRoute({
    getParentRoute: () => tipsRootRoute,
    path: TipsRoutePath.SUCCESS,
    component: SuccessView,
});

const routeTree = tipsRootRoute.addChildren([
    tipsRoute,
    noAvailableWalletRoute,
    tokenSelectRoute,
    loadingRoute,
    successRoute,
    recipientSelectRoute,
]);

const memoryHistory = createMemoryHistory({
    initialEntries: [TipsRoutePath.TIPS],
});

export const router = createRouter({
    routeTree,
    history: memoryHistory,
    defaultPendingMinMs: 0,
});
