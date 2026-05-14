import type { PropsWithChildren } from 'react';

import { PrivyReadyBanner } from '@/components/PrivyReadyBanner.js';
import { useIsPublicRoute } from '@/hooks/useIsPublicRoute.js';

export function PrivyReadyRequired({ children }: PropsWithChildren) {
    const isPublicRoute = useIsPublicRoute();
    if (isPublicRoute) return children;

    return <PrivyReadyBanner>{children}</PrivyReadyBanner>;
}
