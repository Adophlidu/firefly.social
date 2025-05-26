import { AtpAgent, type AtpSessionData, ComAtprotoServerRefreshSession } from '@atproto/api';
import { getPdsEndpoint, isValidDidDoc } from '@atproto/common-web';

import { BskySessionExpiredError } from '@/constants/error.js';
import { isBskyTokenExpired } from '@/helpers/isBskyTokenExpired.js';
import { parseUrl } from '@/helpers/parseUrl.js';
import { retryOnBskyWhenNetworkError } from '@/helpers/retryOnBskyWhenNetworkError.js';
import type { BskySession } from '@/providers/bsky/Session.js';

export async function createBskyAgentAndResume(session: BskySession) {
    const agent = new AtpAgent({ service: session.serviceUrl });
    const pdsUrl = parseUrl(session.sessionPayload.pdsUrl || '');
    if (pdsUrl) {
        agent.sessionManager.pdsUrl = pdsUrl;
    }

    const prevSession: AtpSessionData = session.sessionPayload;
    try {
        if (isBskyTokenExpired(prevSession.accessJwt, 1000 * 60)) {
            console.warn('[Bsky]: session expired, refreshing session');
            await retryOnBskyWhenNetworkError(2, () => agent.resumeSession(prevSession));
        } else {
            console.warn('[Bsky]: session not expired, resuming session');
            agent.sessionManager.session = prevSession;
            await retryOnBskyWhenNetworkError(4, () => agent.resumeSession(prevSession)).catch(
                (e?: { status?: number; message?: string }) => {
                    console.warn('[Bsky]: retry failed to resume session', {
                        status: e?.status || 'unknown',
                        safeMessage: e?.message || 'unknown',
                    });

                    throw e;
                },
            );
        }
    } catch (e) {
        if (!prevSession.refreshJwt) throw new BskySessionExpiredError();

        try {
            /**
             * try refresh session directly here, because agent.resumeSession catch the error from refreshSession
             * so we need to retry it manually to check if the refresh token is expired
             */
            const res = await retryOnBskyWhenNetworkError(2, () =>
                agent.app._client.call('com.atproto.server.refreshSession', undefined, undefined, {
                    headers: { authorization: `Bearer ${prevSession.refreshJwt}` },
                }),
            );
            agent.sessionManager.session = {
                ...prevSession,
                accessJwt: res.data.accessJwt,
                refreshJwt: res.data.refreshJwt,
                handle: res.data.handle,
                did: res.data.did,
            };
            if (isValidDidDoc(res.data.didDoc)) {
                const endpoint = getPdsEndpoint(res.data.didDoc);
                agent.sessionManager.pdsUrl = endpoint ? new URL(endpoint) : undefined;
            }
        } catch (err) {
            const error = ComAtprotoServerRefreshSession.toKnownErr(err);
            if ('error' in error && ['ExpiredToken', 'InvalidToken'].includes(error.error)) {
                throw new BskySessionExpiredError();
            }

            throw error;
        }
    }

    return agent;
}
