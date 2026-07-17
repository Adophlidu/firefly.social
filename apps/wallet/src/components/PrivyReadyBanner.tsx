import { Trans } from '@lingui/react/macro';
import { type PropsWithChildren, useEffect, useState } from 'react';

import { LoadingIcon } from '@/components/LoadingIcon.js';
import { Button } from '@/components/ui/button.js';
import { usePrivyWallet } from '@/hooks/usePrivyWallet.js';

const TIMEOUT_MS = 10000;

export function PrivyReadyBanner({ children }: PropsWithChildren) {
    const { isPrivyReady } = usePrivyWallet();
    const [isTimeout, setIsTimeout] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setIsTimeout(true);
        }, TIMEOUT_MS);

        return () => clearTimeout(timer);
    }, []);

    // Content renders immediately and is never blocked on Privy readiness — write
    // actions (send, swap, withdraw...) already guard on wallet-address readiness
    // themselves. This is only a non-blocking status indicator over the content.
    return (
        <>
            {children}
            {/* Floating banner - doesn't affect layout */}
            {!isPrivyReady && !isTimeout ? (
                <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
                    <div className="flex items-center gap-3 whitespace-nowrap rounded-lg bg-primaryBottom/95 px-4 py-2 shadow-lg backdrop-blur-sm">
                        <LoadingIcon size={16} />
                        <span className="text-sm font-medium text-main">
                            <Trans>Signing In</Trans>
                        </span>
                    </div>
                </div>
            ) : null}
            {!isPrivyReady && isTimeout ? (
                <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
                    <div className="flex items-center gap-3 whitespace-nowrap rounded-lg bg-warn/95 px-4 py-2 shadow-lg backdrop-blur-sm">
                        <span className="text-sm font-medium text-white">
                            <Trans>Connection taking longer than expected</Trans>
                        </span>
                        <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                            <Trans>Refresh</Trans>
                        </Button>
                    </div>
                </div>
            ) : null}
        </>
    );
}
