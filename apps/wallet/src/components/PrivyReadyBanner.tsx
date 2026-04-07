import { Trans } from '@lingui/react/macro';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Button } from '@/components/ui/button.js';
import { useCachedWalletAddresses } from '@/hooks/useCachedWalletAddresses.js';

const TIMEOUT_MS = 10000;

export function PrivyReadyBanner({ children }: PropsWithChildren) {
    const { isFromCache, isPrivyReady, isLoading } = useCachedWalletAddresses();
    const [isTimeout, setIsTimeout] = useState(false);
    const timeoutStartedRef = useRef(false);

    useEffect(() => {
        if (timeoutStartedRef.current || isPrivyReady) return;
        timeoutStartedRef.current = true;

        const timer = window.setTimeout(() => {
            setIsTimeout(true);
        }, TIMEOUT_MS);

        return () => clearTimeout(timer);
    }, [isPrivyReady]);

    // If Privy is ready, just render children
    if (isPrivyReady) {
        return <>{children}</>;
    }

    // If loading with no cache, show full-page loading
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <LoadingIcon size={24} />
                    <span className="text-second text-sm">
                        <Trans>Signing In</Trans>
                    </span>
                </div>
            </div>
        );
    }

    // Render children with floating banner overlay
    return (
        <>
            {children}
            {/* Floating banner - doesn't affect layout */}
            {isTimeout ? (
                <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
                    <div className="bg-warn/95 flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-2 shadow-lg backdrop-blur-sm">
                        <span className="text-sm font-medium text-white">
                            <Trans>Connection taking longer than expected</Trans>
                        </span>
                        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                            <Trans>Refresh</Trans>
                        </Button>
                    </div>
                </div>
            ) : isFromCache ? (
                <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
                    <div className="bg-highlight/95 flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 shadow-lg backdrop-blur-sm">
                        <LoadingIcon size={14} className="text-white" />
                        <span className="text-sm font-medium text-white">
                            <Trans>Connecting to wallet...</Trans>
                        </span>
                    </div>
                </div>
            ) : null}
        </>
    );
}
