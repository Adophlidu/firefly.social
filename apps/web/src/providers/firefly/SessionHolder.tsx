import { FireflyAuthClient } from '@dimensiondev/auth';
import { SessionType, STATUS } from '@dimensiondev/enums';
import { envs } from '@dimensiondev/envs/web';
import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';

import { FetchError, FireflyUnauthorizedError } from '@/constants/error.js';
import { EVENT_FIREFLY_SESSION_REFRESHED, EVENT_FIREFLY_SESSION_UNAUTHORIZED } from '@/constants/event.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import type { NextFetchersOptions } from '@/helpers/fetch.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import type { FireflySession } from '@/providers/firefly/Session.js';
import { settings } from '@/settings/index.js';

/** A 401 from the API — the only response a token refresh can recover from. */
function isUnauthorizedResponse(error: unknown): boolean {
    return error instanceof FetchError && error.status === 401;
}

/** The v3 access token, falling back to the legacy token (used server-side, which has no shared storage). */
function resolveToken(session: FireflySession): string {
    return session.jwtPayload?.accessToken ?? session.token;
}

/**
 * Maintains the freshest Firefly access token from the shared `firefly-state`
 * storage: JWT v3 refresh, cross-tab/sub-site rotation under one origin lock,
 * and legacy→v3 upgrade. `policy` follows the JWT v3 rollout flag. Native is
 * handled by the holder directly (see below), so this is pinned to `web`.
 */
const fireflyAuthClient = new FireflyAuthClient({
    mode: 'web',
    fireflyRootUrl: settings.FIREFLY_ROOT_URL,
    policy: envs.external.NEXT_PUBLIC_FIREFLY_JWT_V3 === STATUS.Enabled ? 'auto' : 'legacy',
    headers: { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET },
});

class FireflySessionHolder extends SessionHolder<FireflySession> {
    /** Latches once a 401 survived a refresh; later requests fail fast. */
    private unauthorized = false;

    constructor() {
        super();
        // The client rotates the token in storage (here or in a sibling tab/sub-site).
        // Re-read the rotated session and keep the in-memory session + app listeners in sync.
        fireflyAuthClient.subscribe(() => {
            const session = getSessionFromStorage(SessionType.Firefly);
            if (!session) return;
            // Ignore updates for a different profile (e.g. account switched elsewhere).
            if (this.internalSession && this.internalSession.profileId !== session.profileId) return;
            this.internalSession = session;
            dispatchCustomEvent(EVENT_FIREFLY_SESSION_REFRESHED, session.serialize());
        });
    }

    override async fetchWithSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        if (this.unauthorized) throw new FireflyUnauthorizedError();

        // Native: the host app owns auth — single request, no client-side refresh.
        if (nativeBridgeProvider.supported) {
            const authToken = await nativeBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {});
            return this.fetchWithToken<T>(url, authToken, init, options);
        }

        // Web: the freshest token from shared storage (the client refreshes/rotates it).
        // Server: no shared storage, so fall back to the resumed session's token.
        const token = (await fireflyAuthClient.getAccessToken()) ?? resolveToken(this.sessionRequired);

        try {
            return await this.fetchWithToken<T>(url, token, init, options);
        } catch (error) {
            // A 401 may be recoverable (clock skew, revocation): refresh and retry once.
            if (!isUnauthorizedResponse(error)) throw error;
            return this.fetchWithTokenAfterRefresh<T>(url, init, options);
        }
    }

    /** Refresh once, then retry. A still-401 means the session is unrecoverable. */
    private async fetchWithTokenAfterRefresh<T>(
        url: string,
        init?: RequestInit,
        options?: NextFetchersOptions,
    ): Promise<T> {
        const token = (await fireflyAuthClient.refresh()) ?? resolveToken(this.sessionRequired);

        try {
            return await this.fetchWithToken<T>(url, token, init, options);
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
}

export const fireflySessionHolder = new FireflySessionHolder();
