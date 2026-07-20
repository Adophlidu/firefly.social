import { useRouterState } from '@dimensiondev/ssr';

import { PUBLIC_ROUTES } from '@/constants/publicRoutes.js';

/** True when the current route bypasses Firefly/Privy auth gates. */
export function useIsPublicRoute(): boolean {
    const { pathname } = useRouterState();

    return PUBLIC_ROUTES.has(pathname);
}
