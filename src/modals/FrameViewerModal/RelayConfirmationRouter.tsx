import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    RouterProvider,
} from '@tanstack/react-router';
import { memo, useMemo } from 'react';

import { AuthWalletSignIn } from '@/modals/FrameViewerModal/AuthWalletSignIn.js';
import type {
    RelayConfirmationPopoverCloseProps,
    RelayConfirmationPopoverOpenProps,
} from '@/modals/FrameViewerModal/RelayConfirmationPopover.js';
import { RelayServiceSignIn } from '@/modals/FrameViewerModal/RelayServiceSignIn.js';

const rootRoute = createRootRoute();

const relayServiceRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/relay-service',
    component: RelayServiceSignIn,
});

const authWalletRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/auth-wallet',
    component: AuthWalletSignIn,
});

const routeTree = rootRoute.addChildren([relayServiceRoute, authWalletRoute]);

export interface RelayConfirmationContext extends RelayConfirmationPopoverOpenProps {
    onClose: (props: RelayConfirmationPopoverCloseProps) => void;
}

export const RelayConfirmationRouter = memo<RelayConfirmationContext>(function RelayConfirmationRouter({
    fid,
    frame,
    options,
    onClose,
}) {
    const router = useMemo(() => {
        const memoryHistory = createMemoryHistory({
            initialEntries: [options.acceptAuthAddress ? '/auth-wallet' : '/relay-service'],
        });

        return createRouter({
            routeTree,
            history: memoryHistory,
            defaultPendingMinMs: 200,
        });
    }, [options.acceptAuthAddress]);

    return <RouterProvider router={router} context={{ onClose, fid, frame, options }} />;
});
