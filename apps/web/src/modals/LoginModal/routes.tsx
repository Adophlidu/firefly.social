import { Trans } from '@lingui/react/macro';
import { createRootRoute, createRoute } from '@tanstack/react-router';

import { BskyView, BskyViewBeforeLoad } from '@/modals/LoginModal/BskyView.js';
import { EmailView, EmailViewBeforeLoad } from '@/modals/LoginModal/EmailView.js';
import { FarcasterView, FarcasterViewBeforeLoad } from '@/modals/LoginModal/FarcasterView.js';
import { LensView, LensViewBeforeLoad } from '@/modals/LoginModal/LensView.js';
import { MainView } from '@/modals/LoginModal/MainView.js';
import { OrbView, OrbViewBeforeLoad } from '@/modals/LoginModal/OrbView.js';
import { type LoginModalOpenProps } from '@/modals/LoginModal/refs.js';
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
        const context = ctx.context as { props?: LoginModalOpenProps } | undefined;
        const hideSocialLogin = context?.props?.options?.hideSocialLogin;

        if (!isLogin || hideSocialLogin) {
            return {
                title: <Trans>Sign in</Trans>,
            };
        }

        return {
            title: <Trans>My Accounts</Trans>,
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
    path: '/x',
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

const orbRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: OrbView,
    pendingComponent: OrbView,
    path: '/orb',
    beforeLoad: OrbViewBeforeLoad,
});

export const routeTree = rootRoute.addChildren([
    mainRoute,
    farcasterRoute,
    lensRoute,
    twitterRoute,
    bskyRoute,
    emailRoute,
    orbRoute,
]);
