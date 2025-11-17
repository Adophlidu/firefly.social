import { rootRouteId, useMatch } from '@tanstack/react-router';

import type { LoginModalOpenProps } from '@/modals/LoginModal/index.js';

export function useShouldSkipWaitMetrics() {
    const { context } = useMatch({ from: rootRouteId }) as {
        context: { props?: LoginModalOpenProps };
    };

    return context?.props?.options?.skipWaitForMetricsSyncing ?? true;
}
