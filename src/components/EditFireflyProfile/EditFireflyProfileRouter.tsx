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
import { EditProfileAvatarEditor } from '@/components/EditProfile/EditProfileAvatarEditor.js';
import type { FireflyAccountProfile } from '@/providers/types/Firefly.js';

export enum Path {
    Root = '/',
    AvatarEditor = '/avatar-editor',
}

function AvatarEditor() {
    return <EditProfileAvatarEditor name="avatar" />;
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

    const avatarEditor = createRoute({
        getParentRoute: () => rootRoute,
        path: Path.AvatarEditor,
        component: AvatarEditor,
    });

    const routeTree = rootRoute.addChildren([formRoute, avatarEditor]);

    const memoryHistory = createMemoryHistory({
        initialEntries: [Path.Root],
    });

    const router = createRouter({
        routeTree,
        history: memoryHistory,
        defaultPendingMinMs: 0,
    });

    return <RouterProvider router={router} context={{ onClose, profile }} />;
});
