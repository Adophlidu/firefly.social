import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';
import { createTwitterSessionAfterLogin } from '@/helpers/createTwitterSessionPayload.js';
import { fetchJSON } from '@/helpers/fetchJSON.js';
import type { NextFetchersOptions } from '@/helpers/getNextFetchers.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { TwitterAuthProvider } from '@/providers/twitter/Auth.js';
import { TwitterSession } from '@/providers/twitter/Session.js';

class TwitterSessionHolder extends SessionHolder<TwitterSession> {
    override resumeSession(session: TwitterSession) {
        this.internalSession = session;
    }

    override async fetch<T>(
        url: string,
        init?: RequestInit,
        options?: NextFetchersOptions & { withSession?: boolean },
    ): Promise<T> {
        await this.ensureSessionForServer();
        return super.fetch(url, init, options);
    }

    override fetchWithSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        const input = bom.window ? url : urlcat(SITE_URL, url);

        return fetchJSON<T>(
            input,
            {
                ...init,
                headers: TwitterSession.payloadToHeaders(this.sessionRequired.payload),
            },
            {
                noDefaultContentType: true,
                noStrictOK: true,
                ...options,
            },
        );
    }

    override fetchWithoutSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        const input = bom.window ? url : urlcat(SITE_URL, url);

        return fetchJSON<T>(input, init, {
            noDefaultContentType: true,
            noStrictOK: true,
            ...options,
        });
    }

    override async removeSession() {
        if (!isServer) await TwitterAuthProvider.logout();
        super.removeSession();
    }

    override async ensureSessionForServer() {
        if (!isServer) return false;
        if (this.internalSession) return true;

        const payload = await createTwitterSessionAfterLogin();
        if (!payload) return false;

        this.resumeSession(TwitterSession.from(payload.clientId, payload));
        return true;
    }
}

export const twitterSessionHolder = new TwitterSessionHolder();
