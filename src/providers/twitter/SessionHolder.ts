import { bom } from '@firefly/utils';
import { isServer } from '@tanstack/react-query';
import urlcat from 'urlcat';

import { SITE_URL } from '@/constants/index.js';
import { fetchJson } from '@/helpers/fetchJson.js';
import type { NextFetchersOptions } from '@/helpers/getNextFetchers.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import { TwitterAuthProvider } from '@/providers/twitter/Auth.js';
import { TwitterSession } from '@/providers/twitter/Session.js';

class TwitterSessionHolder extends SessionHolder<TwitterSession> {
    override async fetch<T>(
        url: string,
        init?: RequestInit,
        options?: NextFetchersOptions & { withSession?: boolean },
    ): Promise<T> {
        return super.fetch(url, init, options);
    }

    override fetchWithSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        const input = bom.window ? url : urlcat(SITE_URL, url);

        return fetchJson<T>(
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

        return fetchJson<T>(input, init, {
            noDefaultContentType: true,
            noStrictOK: true,
            ...options,
        });
    }

    override resumeSession(session: TwitterSession) {
        this.internalSession = session;
    }

    override async removeSession() {
        if (!isServer) await TwitterAuthProvider.logout();
        super.removeSession();
    }
}

export const twitterSessionHolder = new TwitterSessionHolder();
