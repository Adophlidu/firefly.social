import { useLocation } from '@tanstack/react-router';

import { PUBLIC_ROUTES } from '@/constants/publicRoutes.js';

/** True when the current route bypasses Firefly/Privy auth gates. */
export function useIsPublicRoute(): boolean {
    const { pathname } = useLocation();

    return PUBLIC_ROUTES.has(pathname);
}
