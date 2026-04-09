import { IframeBridgeMethod, iframeBridgeProvider } from '@dimensiondev/iframe-bridge';
import { usePrivy, useSyncJwtBasedAuthState } from '@privy-io/react-auth';
import { ClientOnly } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isRunningInIframe } from '@/helpers/isRunningInIframe.js';
import { logger } from '@/lib/Logger.js';
import { fireflySessionTokenAtom } from '@/store/fireflySession.js';
import { store } from '@/store/index.js';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 3000;

function PrivyCustomAuth() {
    const fireflySessionToken = useAtomValue(fireflySessionTokenAtom);
    const [retryKey, setRetryKey] = useState(0);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Include retryKey in deps to force Privy's internal effect to re-run on retry,
    // creating a new subscription that triggers a fresh auth attempt.
    const subscribe = useCallback(
        (onJwtAuthStateChange: () => void) => {
            return store.sub(fireflySessionTokenAtom, onJwtAuthStateChange);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [retryKey],
    );

    // Read directly from store to avoid stale closure when subscribe callback
    // fires before React re-renders with the updated token value.
    const getExternalJwt = useCallback(async () => {
        return store.get(fireflySessionTokenAtom) ?? undefined;
    }, []);

    const onError = useCallback((error: Error) => {
        logger.error('[PrivyCustomAuth] JWT sync error', error);
        if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current += 1;
            const delay = RETRY_BASE_DELAY * retryCountRef.current;
            logger.warn(`[PrivyCustomAuth] Retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
            retryTimerRef.current = setTimeout(() => {
                setRetryKey((k) => k + 1);
            }, delay);
        }
    }, []);

    const { state } = useSyncJwtBasedAuthState({
        getExternalJwt,
        subscribe,
        enabled: !!fireflySessionToken,
        onError,
    });

    // Reset retry count on success
    useEffect(() => {
        if (state.status === 'done') {
            retryCountRef.current = 0;
        }
    }, [state.status]);

    // Cleanup retry timer on unmount
    useEffect(() => {
        return () => clearTimeout(retryTimerRef.current);
    }, []);

    const { authenticated } = usePrivy();

    useEffect(() => {
        if (!authenticated || !isRunningInIframe()) return;

        const FAST_INTERVAL = 1_000;
        const SLOW_INTERVAL = 10_000;
        const FAST_PHASE_DURATION = 60_000;
        const startTime = Date.now();
        let timerId: ReturnType<typeof setTimeout>;

        const send = () => {
            iframeBridgeProvider.request(IframeBridgeMethod.FIREFLY_WALLET_AUTHORIZED, {}).catch(() => {});
        };

        const tick = () => {
            send();
            const elapsed = Date.now() - startTime;
            const interval = elapsed < FAST_PHASE_DURATION ? FAST_INTERVAL : SLOW_INTERVAL;
            timerId = setTimeout(tick, interval);
        };

        tick();

        return () => clearTimeout(timerId);
    }, [authenticated]);

    return null;
}

export function PrivyLoginHandler() {
    return (
        <ClientOnly>
            <PrivyCustomAuth />
        </ClientOnly>
    );
}
