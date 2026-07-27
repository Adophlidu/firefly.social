'use client';

import { useIsNavigating } from '@dimensiondev/ssr';
import { useEffect, useState } from 'react';

/**
 * Thin top progress bar shown while a client-side navigation is in flight
 * and the previous page is still mounted. Delayed by 200ms so quick
 * navigations (cached payloads) never flash it.
 */
export function NavigationProgress() {
    const navigating = useIsNavigating();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!navigating) {
            setVisible(false);
            return;
        }
        const timer = setTimeout(() => setVisible(true), 200);
        return () => clearTimeout(timer);
    }, [navigating]);

    if (!visible) return null;
    return (
        <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-transparent">
            <div className="h-full w-1/3 animate-[progress-slide_1s_ease-in-out_infinite] rounded bg-firefly-brand" />
            <style>{`@keyframes progress-slide{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
        </div>
    );
}
