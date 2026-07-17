import { lazy, type PropsWithChildren, Suspense } from 'react';

import { useIsPublicRoute } from '@/hooks/useIsPublicRoute.js';

// usePrivyWallet() (used by PrivyReadyBanner) pulls in @reown/appkit/react, so this
// must stay a dynamic import — a static one would drag AppKit into the eager root
// chunk. `children` renders immediately via the Suspense fallback either way; the
// banner is a non-blocking overlay that mounts once its chunk is ready.
const PrivyReadyBanner = lazy(() =>
    import('@/components/PrivyReadyBanner.js').then((m) => ({ default: m.PrivyReadyBanner })),
);

export function PrivyReadyRequired({ children }: PropsWithChildren) {
    const isPublicRoute = useIsPublicRoute();
    if (isPublicRoute) return children;

    return (
        <Suspense fallback={children}>
            <PrivyReadyBanner>{children}</PrivyReadyBanner>
        </Suspense>
    );
}
