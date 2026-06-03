import { STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';

import { FetchError, FireflyUnauthorizedError } from '@/constants/error.js';
import { EVENT_FIREFLY_SESSION_REFRESHED, EVENT_FIREFLY_SESSION_UNAUTHORIZED } from '@/constants/event.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import type { NextFetchersOptions } from '@/helpers/fetch.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { logger } from '@/libs/Logger.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import type { FireflySession } from '@/providers/firefly/Session.js';

/** Refresh the access token this many milliseconds before it actually expires. */
const PROACTIVE_REFRESH_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/** A 401 from the API — the only response a token refresh can recover from. */
function isUnauthorizedResponse(error: unknown): boolean {
    return error instanceof FetchError && error.status === 401;
}

/** The v3 access token, falling back to the legacy token before an upgrade lands. */
function resolveToken(session: FireflySession): string {
    return session.jwtPayload?.accessToken ?? session.token;
}

/** Whether the token is within the proactive-refresh window of its expiry. */
function shouldProactivelyRefresh(session: FireflySession): boolean {
    return (
        !!session.jwtPayload?.refreshToken &&
        session.expiresAt > 0 &&
        Date.now() > session.expiresAt - PROACTIVE_REFRESH_THRESHOLD_MS
    );
}

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

    /**
     * Latches once the session is unrecoverably unauthorized (a 401 survived a refresh).
     * Collapses a batch of concurrent requests into a single unauthorized event and lets
     * subsequent requests fail fast instead of hammering the API with doomed retries.
     */
    private unauthorized = false;

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
    private async fetchWithSessionJWT<T>(url: string, init?: RequestInit, options?: NextFetchersOptions): Promise<T> {
        // Fail fast once the session is known to be unauthorized. A batch of pending
        // requests would otherwise each round-trip the API and re-discover the same
        // dead session; short-circuiting collapses them to a single thrown error.
        if (this.unauthorized) throw new FireflyUnauthorizedError();

        // The native bridge owns its own auth: no upgrade, no refresh, no retry.
        if (nativeBridgeProvider.supported) {
            const authToken = await nativeBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {});
            return this.fetchWithToken<T>(url, authToken, init, options);
        }

        const session = this.sessionRequired;

        // Seamless upgrade: legacy users still carry a v1 token but no v3 token pair.
        // Exchange it for v3 tokens on the first authenticated request so they switch
        // to the new JWT auth without noticing.
        if (session.isLegacy) await this.upgradeTokenOnce(session);

        // Proactive refresh: rotate the token before it expires so no request ever
        // hits the server with a stale one.
        if (shouldProactivelyRefresh(session)) await this.refreshTokenOnce(session);

        try {
            return await this.fetchWithToken<T>(url, resolveToken(session), init, options);
        } catch (error) {
            // A 401 here may still be recoverable (clock skew, server-side revocation,
            // or a session restored from storage without expiry metadata): refresh and
            // retry once. Anything else — or a session that can't refresh — propagates.
            if (!isUnauthorizedResponse(error) || !session.jwtPayload?.refreshToken) throw error;
            return this.fetchWithTokenAfterRefresh<T>(url, session, init, options);
        }
    }

    /** Refresh once, then retry. A still-401 means the refresh token itself is dead. */
    private async fetchWithTokenAfterRefresh<T>(
        url: string,
        session: FireflySession,
        init?: RequestInit,
        options?: NextFetchersOptions,
    ): Promise<T> {
        await this.refreshTokenOnce(session);

        try {
            return await this.fetchWithToken<T>(url, resolveToken(session), init, options);
        } catch (error) {
            // The refresh didn't help: the refresh token is expired or revoked. This is
            // the unrecoverable case — notify (once) and surface a dedicated error so the
            // UI can show the signed-out screen.
            if (!isUnauthorizedResponse(error)) throw error;
            this.notifyUnauthorizedOnce();
            throw new FireflyUnauthorizedError();
        }
    }

    /** Issues the request with a Bearer token. */
    private fetchWithToken<T>(url: string, token: string, init?: RequestInit, options?: NextFetchersOptions) {
        return fetchJson<T>(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } }, options);
    }

    /**
     * Dispatches the unauthorized event exactly once per holder instance.
     * Concurrent 401s all funnel here but only the first reaches listeners.
     */
    private notifyUnauthorizedOnce() {
        if (this.unauthorized) return;
        this.unauthorized = true;
        dispatchCustomEvent(EVENT_FIREFLY_SESSION_UNAUTHORIZED);
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
                .catch((error: unknown) => {
                    logger.warn('[FireflySession] Failed to refresh token', error);
                })
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
