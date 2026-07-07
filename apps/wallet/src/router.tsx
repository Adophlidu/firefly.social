import { envs } from '@dimensiondev/envs/wallet';
import { createMemoryHistory, createRouter } from '@tanstack/react-router';

import { DefaultPendingComponent } from '@/components/DefaultPendingComponent.js';
import { routeTree } from '@/routeTree.gen.js';

// All static routes to preload (excluding dynamic routes with params)
const staticRoutes = [
    '/',
    '/receive',
    '/send',
    '/transactions',
    '/bet',
    '/bet/deposit',
    '/bet/withdraw',
    '/bet/history',
    '/bet/export-key',
    '/bet/order/open',
] as const;

export function createAppRouter() {
    const history =
        typeof window !== 'undefined'
            ? createMemoryHistory({
                  initialEntries: [window.location.pathname + window.location.search],
              })
            : undefined;

    const router = createRouter({
        routeTree,
        basepath: envs.external.NEXT_PUBLIC_BASE_PATH,
        history,
        trailingSlash: 'never',
        // Preload routes when they enter the viewport
        defaultPreload: 'viewport',
        // Keep for initial load Suspense fallback
        defaultPendingComponent: DefaultPendingComponent,
        // Infinity prevents the router from forcing pending state during navigation.
        // React.startTransition keeps the old page visible until the new one is ready.
        defaultPendingMs: Infinity,
    });

    // Preload all static routes after router is ready
    if (typeof window !== 'undefined') {
        // Use requestIdleCallback to preload routes when browser is idle
        const preloadAllRoutes = () => {
            for (const route of staticRoutes) {
                router.preloadRoute({ to: route }).catch(() => {
                    // Silently ignore preload errors
                });
            }
        };

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(preloadAllRoutes, { timeout: 5000 });
        } else {
            // Fallback for Safari
            setTimeout(preloadAllRoutes, 1000);
        }
    }

    return router;
}

// TanStack Start expects this export name
export function getRouter() {
    return createAppRouter();
}

declare module '@tanstack/react-router' {
    interface Register {
        router: ReturnType<typeof createAppRouter>;
    }
}
