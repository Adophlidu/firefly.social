import { Trans } from '@lingui/react/macro';
import { createRootRoute, createRoute } from '@tanstack/react-router';

import { BskyView, BskyViewBeforeLoad } from '@/modals/LoginModal/BskyView.js';
import { EmailView, EmailViewBeforeLoad } from '@/modals/LoginModal/EmailView.js';
import { FarcasterView, FarcasterViewBeforeLoad } from '@/modals/LoginModal/FarcasterView.js';
import { LensView, LensViewBeforeLoad } from '@/modals/LoginModal/LensView.js';
import { MainView } from '@/modals/LoginModal/MainView.js';
import { RootView } from '@/modals/LoginModal/RootView.js';
import { TwitterView } from '@/modals/LoginModal/TwitterView.js';

const rootRoute = createRootRoute({
    component: RootView,
});

const mainRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: MainView,
    path: '/main',
    beforeLoad: (ctx) => {
        const isLogin = 'isLogin' in ctx.search ? ctx.search.isLogin : false;
        if (isLogin) {
            return {
                title: <Trans>My Accounts</Trans>,
            };
        }
        return {
            title: <Trans>Sign in</Trans>,
        };
    },
});

const farcasterRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: FarcasterView,
    pendingComponent: FarcasterView,
    path: '/farcaster',
    beforeLoad: FarcasterViewBeforeLoad,
});

const lensRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: LensView,
    pendingComponent: LensView,
    path: '/lens',
    beforeLoad: LensViewBeforeLoad,
});

const twitterRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: TwitterView,
    pendingComponent: TwitterView,
    path: '/twitter',
});

const bskyRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: BskyView,
    pendingComponent: BskyView,
    path: '/bsky',
    beforeLoad: BskyViewBeforeLoad,
});

const emailRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: EmailView,
    pendingComponent: EmailView,
    path: '/email',
    beforeLoad: EmailViewBeforeLoad,
});

export const routeTree = rootRoute.addChildren([
    mainRoute,
    farcasterRoute,
    lensRoute,
    twitterRoute,
    bskyRoute,
    emailRoute,
]);
