import { nativeBridgeProvider, SupportedMethod } from '@dimensiondev/native-bridge';

import { fetchJson } from '@/helpers/fetchJson.js';
import type { NextFetchersOptions } from '@/helpers/getNextFetchers.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';

class FarcasterSessionHolder extends SessionHolder<FarcasterSession> {
    override resumeSession(session: FarcasterSession) {
        this.internalSession = session;
    }

    override async fetchWithSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
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

    override fetchWithoutSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        return fetchJson<T>(url, init, options);
    }
}

export const farcasterSessionHolder = new FarcasterSessionHolder();
