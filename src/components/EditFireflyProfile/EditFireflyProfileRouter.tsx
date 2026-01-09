import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    RouterProvider,
} from '@tanstack/react-router';
import { memo } from 'react';

import { EditFireflyProfileForm } from '@/components/EditFireflyProfile/EditFireflyProfileForm.js';
import { EditFireflyProfileRouteRoot } from '@/components/EditFireflyProfile/EditFireflyProfileRouteRoot.js';
import { type FireflyAccountProfile } from '@/providers/types/Firefly.js';

export enum Path {
    Root = '/',
}

export const EditFireflyProfileRouter = memo<{
    onClose: () => void;
    profile?: FireflyAccountProfile;
}>(function EditFireflyProfileRouter({ onClose, profile }) {
    const rootRoute = createRootRoute({
        component: EditFireflyProfileRouteRoot,
        shouldReload: true,
    });

    const formRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: Path.Root,
        component: EditFireflyProfileForm,
    });

    const memoryHistory = createMemoryHistory({
        initialEntries: [Path.Root],
    });

    const routeTree = rootRoute.addChildren([formRoute]);
    const router = createRouter({
        routeTree,
        history: memoryHistory,
        defaultPendingMinMs: 0,
    });

    return <RouterProvider router={router} context={{ onClose, profile }} />;
});
