import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';

import { FetchError } from '@/constants/error.js';
import { EVENT_FIREFLY_SESSION_REFRESHED } from '@/constants/event.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import type { NextFetchersOptions } from '@/helpers/fetch.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { logger } from '@/libs/Logger.js';
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

    /**
     * Shared promise while a legacy → v3 upgrade is in-flight.
     * Concurrent requests wait on the same upgrade rather than each exchanging their own token.
     */
    private upgradePromise: Promise<void> | null = null;

    override async fetchWithSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        // JWT v3 master switch. When enabled, run the full v3 auth flow
        // (upgrade + refresh + v3 access token). When disabled, fall back to the
        // legacy v1 token auth below — no upgrade, no refresh, no v3 access token.
        if (envs.external.NEXT_PUBLIC_FIREFLY_JWT_V3 === STATUS.Enabled) {
            return this.fetchWithSessionJWT<T>(url, init, options);
        }

        const authToken = nativeBridgeProvider.supported
            ? await nativeBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {})
            : this.sessionRequired.token;

        return fetchJson<T>(
            url,
            {
                ...init,
                headers: { ...init?.headers, Authorization: `Bearer ${authToken}` },
            },
            options,
        );
    }

    /**
     * JWT v3 auth flow: seamlessly upgrades legacy sessions to the v3 token pair,
     * proactively and reactively rotates the short-lived access token, and
     * authenticates with the v3 access token (falling back to the legacy token
     * where a v3 token isn't available yet).
     */
    private async fetchWithSessionJWT<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        const session = this.sessionRequired;

        // Seamless upgrade: legacy users still carry a v1 token but no v3 token
        // pair. Exchange it for v3 tokens on the first authenticated request so
        // they switch to the new JWT auth without noticing. The native bridge
        // owns its own auth, so skip it there.
        if (!nativeBridgeProvider.supported && session.isLegacy) {
            await this.upgradeTokenOnce(session);
        }

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

    /**
     * Ensures only one legacy → v3 upgrade is in-flight at a time.
     * Concurrent callers await the same promise and all benefit from the single exchange.
     */
    private upgradeTokenOnce(session: FireflySession): Promise<void> {
        if (!this.upgradePromise) {
            this.upgradePromise = session
                .upgrade()
                .then(() => dispatchCustomEvent(EVENT_FIREFLY_SESSION_REFRESHED, session.serialize()))
                .catch((error: unknown) => {
                    // Best-effort: the legacy token still works as a fallback auth header,
                    // so a failed upgrade must not break the request. It will be retried on
                    // the next request until it succeeds.
                    logger.warn('[FireflySession] Failed to upgrade legacy session to v3', error);
                })
                .finally(() => {
                    this.upgradePromise = null;
                });
        }
        return this.upgradePromise;
    }
}

export const fireflySessionHolder = new FireflySessionHolder();
