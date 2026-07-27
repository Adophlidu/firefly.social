'use client';

import { useIsNavigating } from '@dimensiondev/ssr';

/**
 * Thin top progress bar shown while a client-side navigation is in flight
 * and the previous page is still mounted (the chain could not swap
 * immediately). When the new chain swaps instantly, the route's own
 * loadingComponent takes over and this stays hidden most of the time.
 */
export function NavigationProgress() {
    const navigating = useIsNavigating();
    if (!navigating) return null;
    return (
        <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-transparent">
            <div className="h-full w-1/3 animate-[progress-slide_1s_ease-in-out_infinite] rounded bg-firefly-brand" />
            <style>{`@keyframes progress-slide{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
        </div>
    );
}
