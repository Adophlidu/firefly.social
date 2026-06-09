'use client';

import { useEffect, useState } from 'react';

import type { FireflyAuthClient } from '@/FireflyAuthClient.js';

/**
 * Subscribe a component to the freshest Firefly access token from a given
 * {@link FireflyAuthClient}.
 *
 * Triggers an initial resolve (refreshing if needed) on mount and re-renders
 * whenever the token changes — proactive refresh, 401 recovery, or a cross-tab
 * login/logout. Returns `null` until the first token resolves or when signed out.
 *
 * Pass a stable client instance (e.g. a module-level singleton or one held in
 * context) so the effect doesn't re-subscribe on every render.
 */
export function useFireflyAccessToken(client: FireflyAuthClient): string | null {
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        void client.getAccessToken().then((token) => {
            if (active) setAccessToken(token);
        });

        const unsubscribe = client.subscribe((token) => {
            if (active) setAccessToken(token);
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [client]);

    return accessToken;
}
