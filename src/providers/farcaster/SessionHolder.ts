import { fetchJSON } from '@/helpers/fetchJSON.js';
import { fetchNeynarJSON } from '@/helpers/fetchNeynar.js';
import type { NextFetchersOptions } from '@/helpers/getNextFetchers.js';
import { SessionHolder } from '@/providers/base/SessionHolder.js';
import type { FarcasterSession } from '@/providers/farcaster/Session.js';
import { fireflyBridgeProvider } from '@/providers/firefly/Bridge.js';
import { SupportedMethod } from '@/types/bridge.js';

class FarcasterSessionHolder extends SessionHolder<FarcasterSession> {
    override resumeSession(session: FarcasterSession) {
        this.internalSession = session;
    }

    override async fetchWithSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        const authToken = fireflyBridgeProvider.supported
            ? await fireflyBridgeProvider.request(SupportedMethod.GET_AUTHORIZATION, {})
            : this.sessionRequired.token;
        return fetchJSON<T>(
            url,
            {
                ...init,
                headers: { ...init?.headers, Authorization: `Bearer ${authToken}` },
            },
            options,
        );
    }

    override fetchWithoutSession<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        return fetchJSON<T>(url, init, options);
    }

    async fetchHubble<T>(url: string, init?: RequestInit, options?: NextFetchersOptions) {
        return fetchNeynarJSON<T>(url, init, {
            noStrictOK: true,
            ...options,
        });
    }
}

export const farcasterSessionHolder = new FarcasterSessionHolder();
