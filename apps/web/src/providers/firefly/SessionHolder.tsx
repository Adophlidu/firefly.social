import { SessionType, Source, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';

import { FetchError, FireflyUnauthorizedError } from '@/constants/error.js';
import { EVENT_FIREFLY_SESSION_REFRESHED, EVENT_FIREFLY_SESSION_UNAUTHORIZED } from '@/constants/event.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import type { NextFetchersOptions } from '@/helpers/fetch.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { updateCurrentSessionToStorage } from '@/helpers/updateCurrentSessionToStorage.js';
import { withTokenLock } from '@/helpers/withTokenLock.js';
import { logger } from '@/libs/Logger.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import type { FireflySession } from '@/providers/firefly/Session.js';

/** Refresh the access token this many milliseconds before it actually expires. */
const PROACTIVE_REFRESH_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/** Origin-wide lock name that serializes JWT token rotation across browser tabs. */
const FIREFLY_TOKEN_LOCK = 'firefly:jwt:token';

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
    /** Shared in-flight refresh so concurrent requests wait on one rotation. */
    private refreshPromise: Promise<void> | null = null;

    /** Shared in-flight legacy → v3 upgrade so concurrent requests wait on one exchange. */
    private upgradePromise: Promise<void> | null = null;

    /** Latches once a 401 survived a refresh; later requests fail fast. */
    private unauthorized = false;

    override async fetchWithSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        // JWT v3 master switch: on → full v3 flow; off → legacy v1 token only.
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

    /** v3 auth flow: upgrade legacy sessions, rotate the access token, auth with it. */
    private async fetchWithSessionJWT<T>(url: string, init?: RequestInit, options?: NextFetchersOptions): Promise<T> {
        // Known-dead session: fail fast instead of re-discovering it per request.
        if (this.unauthorized) throw new FireflyUnauthorizedError();

        // The native bridge owns its own auth: no upgrade, no refresh, no retry.
        if (nativeBridgeProvider.supported) {
            const authToken = await nativeBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {});
            return this.fetchWithToken<T>(url, authToken, init, options);
        }

        const session = this.sessionRequired;

        // Legacy → v3: exchange the v1 token for a token pair on first use.
        if (session.isLegacy) await this.upgradeTokenOnce(session);

        // Rotate before expiry so no request hits the server with a stale token.
        if (shouldProactivelyRefresh(session)) await this.refreshTokenOnce(session);

        try {
            return await this.fetchWithToken<T>(url, resolveToken(session), init, options);
        } catch (error) {
            // A 401 may be recoverable (clock skew, revocation, missing expiry): refresh and retry once.
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
            // Refresh didn't help: token is dead. Notify once and surface the signed-out error.
            if (!isUnauthorizedResponse(error)) throw error;
            this.notifyUnauthorizedOnce();
            throw new FireflyUnauthorizedError();
        }
    }

    /** Issues the request with a Bearer token. */
    private fetchWithToken<T>(url: string, token: string, init?: RequestInit, options?: NextFetchersOptions) {
        return fetchJson<T>(url, { ...init, headers: { ...init?.headers, Authorization: `Bearer ${token}` } }, options);
    }

    /** Dispatches the unauthorized event once; concurrent 401s funnel through here. */
    private notifyUnauthorizedOnce() {
        if (this.unauthorized) return;
        this.unauthorized = true;
        dispatchCustomEvent(EVENT_FIREFLY_SESSION_UNAUTHORIZED);
    }

    override fetchWithoutSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        return fetchJson<T>(url, init, options);
    }

    /** Dedupe refreshes within this tab: concurrent callers await one rotation. */
    private refreshTokenOnce(session: FireflySession): Promise<void> {
        if (!this.refreshPromise) {
            this.refreshPromise = this.rotateTokenExclusively(session, () => session.refresh())
                .catch((error: unknown) => {
                    logger.warn('[FireflySession] Failed to refresh token', error);
                })
                .finally(() => {
                    this.refreshPromise = null;
                });
        }
        return this.refreshPromise;
    }

    /** Dedupe upgrades within this tab: concurrent callers await one exchange. */
    private upgradeTokenOnce(session: FireflySession): Promise<void> {
        if (!this.upgradePromise) {
            this.upgradePromise = this.rotateTokenExclusively(session, () => session.upgrade())
                .catch((error: unknown) => {
                    logger.warn('[FireflySession] Failed to upgrade legacy session to v3', error);
                })
                .finally(() => {
                    this.upgradePromise = null;
                });
        }
        return this.upgradePromise;
    }

    /**
     * Dedupe rotations across tabs via the lock. After winning it, adopt a sibling
     * tab's already-rotated pair if present (the single-use refresh token would
     * otherwise 401); else rotate and persist so the next tab sees it.
     */
    private rotateTokenExclusively(session: FireflySession, rotate: () => Promise<void>): Promise<void> {
        // Token held before contending; a different one in storage means a sibling rotated.
        const previousAccessToken = session.jwtPayload?.accessToken;

        return withTokenLock(FIREFLY_TOKEN_LOCK, async () => {
            if (this.adoptRotatedTokenFromStorage(session, previousAccessToken)) return;

            await rotate();
            updateCurrentSessionToStorage(Source.Firefly, session);
            dispatchCustomEvent(EVENT_FIREFLY_SESSION_REFRESHED, session.serialize());
        });
    }

    /** Adopt a sibling tab's rotated pair from storage; `true` if adopted (skip rotation). */
    private adoptRotatedTokenFromStorage(session: FireflySession, previousAccessToken: string | undefined): boolean {
        const stored = getSessionFromStorage(SessionType.Firefly);
        const rotatedAccessToken = stored?.jwtPayload?.accessToken;

        if (!rotatedAccessToken || rotatedAccessToken === previousAccessToken) return false;
        // Never adopt another profile's tokens (e.g. account switched in a sibling tab).
        if (stored.profileId !== session.profileId) return false;

        session.jwtPayload = stored.jwtPayload;
        session.expiresAt = stored.expiresAt;
        dispatchCustomEvent(EVENT_FIREFLY_SESSION_REFRESHED, session.serialize());
        return true;
    }
}

export const fireflySessionHolder = new FireflySessionHolder();
