import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';

import { FetchError } from '@/constants/error.js';
import { EVENT_FIREFLY_SESSION_REFRESHED } from '@/constants/event.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import type { NextFetchersOptions } from '@/helpers/fetch.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import type { FireflySession } from '@/providers/firefly/Session.js';

/** Refresh the access token this many milliseconds before it actually expires. */
const PROACTIVE_REFRESH_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

class FireflySessionHolder extends SessionHolder<FireflySession> {
    /**
     * Shared promise while a token refresh is in-flight.
     * All concurrent requests wait on the same refresh rather than each firing their own.
     */
    private refreshPromise: Promise<void> | null = null;

    override async fetchWithSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        const session = this.sessionRequired;

        // Proactive refresh: rotate the token before it expires so no request
        // ever hits the server with a stale token. Only applies to v3 sessions
        // (refreshToken present) and not to the native bridge (which owns its auth).
        if (
            !nativeBridgeProvider.supported &&
            session.jwtPayload?.refreshToken &&
            session.expiresAt > 0 &&
            Date.now() > session.expiresAt - PROACTIVE_REFRESH_THRESHOLD_MS
        ) {
            await this.refreshTokenOnce(session);
        }

        const authToken = nativeBridgeProvider.supported
            ? await nativeBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {})
            : (session.jwtPayload?.accessToken ?? session.token);

        try {
            return await fetchJson<T>(
                url,
                {
                    ...init,
                    headers: { ...init?.headers, Authorization: `Bearer ${authToken}` },
                },
                options,
            );
        } catch (error) {
            // Reactive safety net: handles clock skew, server-side revocation, or
            // sessions restored from localStorage where expiresAt wasn't available.
            if (
                error instanceof FetchError &&
                error.status === 401 &&
                !nativeBridgeProvider.supported &&
                session.jwtPayload?.refreshToken
            ) {
                await this.refreshTokenOnce(session);
                return fetchJson<T>(
                    url,
                    {
                        ...init,
                        headers: {
                            ...init?.headers,
                            Authorization: `Bearer ${session.jwtPayload?.accessToken ?? session.token}`,
                        },
                    },
                    options,
                );
            }
            throw error;
        }
    }

    override fetchWithoutSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        return fetchJson<T>(url, init, options);
    }

    /**
     * Ensures only one refresh call is in-flight at a time.
     * Concurrent callers await the same promise and all benefit from the single refresh.
     */
    private refreshTokenOnce(session: FireflySession): Promise<void> {
        if (!this.refreshPromise) {
            this.refreshPromise = session
                .refresh()
                .then(() => dispatchCustomEvent(EVENT_FIREFLY_SESSION_REFRESHED, session.serialize()))
                .finally(() => {
                    this.refreshPromise = null;
                });
        }
        return this.refreshPromise;
    }
}

export const fireflySessionHolder = new FireflySessionHolder();
