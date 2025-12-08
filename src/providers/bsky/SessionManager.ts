import { isServer } from '@tanstack/react-query';

import { PUBLIC_SERVICE_URL } from '@/constants/bsky.js';
import { Source } from '@/constants/enum.js';
import { SessionExpiredError } from '@/constants/error.js';
import { EVENT_SOCIAL_ACCOUNT_EXPIRED } from '@/constants/event.js';
import { dispatchCustomEvent } from '@/helpers/dispatchCustomEvents.js';
import { getSessionFromStorage } from '@/helpers/getSessionFromStorage.js';
import { updateCurrentSessionToStorage } from '@/helpers/updateCurrentSessionToStorage.js';
import { getPdsUrlFromSession } from '@/providers/bsky/getPdsUrlFromSession.js';
import { isErrorResponse } from '@/providers/bsky/isErrorResponse.js';
import { refreshBskySession } from '@/providers/bsky/refreshBskySession.js';
import { SessionType } from '@/providers/types/SocialMedia.js';

export class SessionManager {
    private refreshSessionPromise: Promise<void> | undefined;

    constructor(public fetch = globalThis.fetch) {}

    get serviceUrl() {
        if (isServer) return new URL(PUBLIC_SERVICE_URL);

        const session = getSessionFromStorage(SessionType.Bsky);
        if (!session) return new URL(PUBLIC_SERVICE_URL);

        return new URL(session.serviceUrl);
    }

    get did() {
        if (isServer) return;

        const session = getSessionFromStorage(SessionType.Bsky);
        if (!session) return;

        return session.did;
    }

    get pdsUrl() {
        if (isServer) return;

        const session = getSessionFromStorage(SessionType.Bsky);
        if (!session) return;

        return getPdsUrlFromSession(session);
    }

    get dispatchUrl() {
        return this.pdsUrl || this.serviceUrl;
    }

    async fetchHandler(url: string, init?: RequestInit): Promise<Response> {
        if (this.refreshSessionPromise && !isServer) {
            await this.refreshSessionPromise;
        }

        const initialUri = new URL(url, this.dispatchUrl);
        const initialReq = new Request(initialUri, init);
        if (isServer) return (0, this.fetch)(initialReq);

        const accessJwt = getSessionFromStorage(SessionType.Bsky)?.sessionPayload?.accessJwt;
        if (!accessJwt) return (0, this.fetch)(initialReq);

        // set auth header
        initialReq.headers.set('authorization', `Bearer ${accessJwt}`);
        const initialRes = await (0, this.fetch)(initialReq);

        const refreshJwt = getSessionFromStorage(SessionType.Bsky)?.sessionPayload?.refreshJwt;
        if (!refreshJwt) return initialRes;

        const isExpiredError = await isErrorResponse(initialRes, [400], ['ExpiredToken']);
        if (!isExpiredError) return initialRes;

        // try refresh session and fetch again
        try {
            await this.refreshSession();
        } catch (err) {
            if (err instanceof SessionExpiredError) {
                dispatchCustomEvent(EVENT_SOCIAL_ACCOUNT_EXPIRED, { source: Source.Bsky });
                throw err;
            }

            return initialRes;
        }

        if (init?.signal?.aborted) {
            return initialRes;
        }

        // The stream was already consumed, cannot retry the request
        if (ReadableStream && init?.body instanceof ReadableStream) {
            return initialRes;
        }

        // make sure the token is refreshed
        const newAccessJwt = getSessionFromStorage(SessionType.Bsky)?.sessionPayload?.accessJwt;
        if (!newAccessJwt || newAccessJwt === accessJwt) return initialRes;

        // cancel old request
        await initialRes.body?.cancel();

        const updatedUri = new URL(url, this.dispatchUrl);
        const updatedReq = new Request(updatedUri, init);
        updatedReq.headers.set('authorization', `Bearer ${newAccessJwt}`);

        return (0, this.fetch)(updatedReq);
    }

    async refreshSession() {
        return (this.refreshSessionPromise ||= this._refreshSession().finally(() => {
            this.refreshSessionPromise = undefined;
        }));
    }

    private async _refreshSession() {
        const bskySession = getSessionFromStorage(SessionType.Bsky);
        if (!bskySession?.sessionPayload?.refreshJwt) return;

        const res = await refreshBskySession(bskySession);
        const oldSession = getSessionFromStorage(SessionType.Bsky);
        if (!oldSession) return;

        updateCurrentSessionToStorage(Source.Bsky, res);
    }
}
