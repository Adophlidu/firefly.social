import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    RouterProvider,
} from '@tanstack/react-router';
import { memo } from 'react';

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

const memoryHistory = createMemoryHistory({
    initialEntries: ['/auth-wallet'],
});

const router = createRouter({
    routeTree,
    history: memoryHistory,
    defaultPendingMinMs: 200,
});

export interface RelayConfirmationContext extends RelayConfirmationPopoverOpenProps {
    onClose: (props: RelayConfirmationPopoverCloseProps) => void;
}

export const RelayConfirmationRouter = memo<RelayConfirmationContext>(function RelayConfirmationRouter({
    fid,
    frame,
    options,
    onClose,
}) {
    return <RouterProvider router={router} context={{ onClose, fid, frame, options }} />;
});
