import { Trans } from '@lingui/react/macro';
import { createRootRoute, createRoute, lazyRouteComponent } from '@tanstack/react-router';

import { RootView } from '@/modals/RedPacketModal/RootView.js';

const rootRoute = createRootRoute({
    component: RootView,
});

const mainRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./MainView.js')),
    path: '/main',
    beforeLoad: () => {
        return {
            title: <Trans>Lucky Drop</Trans>,
        };
    },
});

const confirmRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./ConfirmView.js')),
    path: '/confirm',
    beforeLoad: () => {
        return {
            title: <Trans>Confirm Lucky Drop</Trans>,
        };
    },
});

const historyRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./HistoryView.js')),
    path: '/history',
    beforeLoad: () => {
        return {
            title: <Trans>History</Trans>,
        };
    },
});

const requirementsRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./RequirementsView.js')),
    path: '/requirements',
    beforeLoad: () => {
        return {
            title: <Trans>Claim Requirements</Trans>,
        };
    },
});

const requirementRulesRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./RequirementRules.js')),
    path: '/requirement-rules',
    beforeLoad: () => {
        return {
            title: <Trans>Claim Requirements</Trans>,
        };
    },
});

const historyDetailRoute = createRoute({
    getParentRoute: () => rootRoute,
    component: lazyRouteComponent(() => import('./HistoryDetailView.js')),
    path: '/detail',
    beforeLoad: () => {
        return {
            title: <Trans>More Details</Trans>,
        };
    },
});

export const routeTree = rootRoute.addChildren([
    mainRoute,
    confirmRoute,
    historyRoute,
    requirementsRoute,
    historyDetailRoute,
    requirementRulesRoute,
]);
