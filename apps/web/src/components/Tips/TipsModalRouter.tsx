'use client';

import { Trans } from '@lingui/react/macro';
import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    RouterProvider,
} from '@tanstack/react-router';
import { first } from 'lodash-es';
import { memo, useEffect, useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoAvailableWallet } from '@/components/Tips/NoAvailableWallet.js';
import {
    CloseTipsOnSuccessContext,
    OpenTipsModalContext,
    RootView,
    TipsSuccessContext,
} from '@/components/Tips/views/RootView.js';
import { SuccessView } from '@/components/Tips/views/SuccessView.js';
import { TipsMainView } from '@/components/Tips/views/TipsMainView.js';
import { TipsRecipientListView } from '@/components/Tips/views/TipsRecipientListView.js';
import { TokenSelectorView } from '@/components/Tips/views/TokenSelectorView.js';
import type { TipsSuccessResult } from '@/modals/TipsModal/refs.js';

export enum TipsRoutePath {
    TIPS = '/tips',
    NO_AVAILABLE_WALLET = '/no-available-wallet',
    SELECT_TOKEN = '/select-token',
    SELECT_RECIPIENT = '/select-recipient',
    LOADING = '/',
    SUCCESS = '/success',
}

export const TipsModelRouter = memo<{
    onClose: () => void;
    onSuccess?: (result: TipsSuccessResult) => Promise<void> | void;
    closeOnSuccess?: boolean;
    open: boolean;
    initialEntries?: TipsRoutePath[];
}>(({ onClose, onSuccess, closeOnSuccess = false, open, initialEntries = [TipsRoutePath.TIPS] }) => {
    const router = useMemo(() => {
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
            // eslint-disable-next-line react/no-unstable-nested-components
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
            initialEntries: initialEntries && initialEntries.length > 0 ? [...initialEntries] : [TipsRoutePath.TIPS],
        });

        return createRouter({
            routeTree,
            history: memoryHistory,
            defaultPendingMinMs: 0,
        });
    }, [initialEntries]);

    useEffect(() => {
        const firstPath = first(initialEntries);
        const pathname = router.state.location.pathname;
        if (open && firstPath && pathname !== firstPath) {
            router.navigate({ to: firstPath, replace: true });
        }
    }, [open, initialEntries, router]);

    return (
        <OpenTipsModalContext.Provider value={open}>
            <CloseTipsOnSuccessContext.Provider value={closeOnSuccess}>
                <TipsSuccessContext.Provider value={onSuccess}>
                    <RouterProvider router={router} context={{ onClose }} />
                </TipsSuccessContext.Provider>
            </CloseTipsOnSuccessContext.Provider>
        </OpenTipsModalContext.Provider>
    );
});
