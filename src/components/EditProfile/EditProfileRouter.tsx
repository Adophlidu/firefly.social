import {
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    RouterProvider,
} from '@tanstack/react-router';
import { memo } from 'react';

import { EditProfileForm } from '@/components/EditProfile/EditProfileForm.js';
import { EditProfileRouteRoot } from '@/components/EditProfile/EditProfileRouteRoot.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export enum Path {
    Root = '/',
}

export const EditProfileRouter = memo<{
    profile: Profile;
    onClose: () => void;
}>(function EditProfileRouter({ profile, onClose }) {
    const rootRoute = createRootRoute({
        component: EditProfileRouteRoot,
        shouldReload: true,
    });

    const formRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/',
        component: EditProfileForm,
    });

    const routeTree = rootRoute.addChildren([formRoute]);

    const memoryHistory = createMemoryHistory({
        initialEntries: ['/'],
    });

    const router = createRouter({
        routeTree,
        history: memoryHistory,
        defaultPendingMinMs: 0,
    });

    return <RouterProvider router={router} context={{ onClose, profile }} />;
});
