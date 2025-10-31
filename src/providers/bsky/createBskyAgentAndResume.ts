import { type AtpSessionData } from '@atproto/api';
import { getPdsEndpoint, isValidDidDoc } from '@atproto/common-web';
import { parseUrl } from '@dimensiondev/utils';

import { BskySessionExpiredError } from '@/constants/error.js';
import { createBskyAgent } from '@/providers/bsky/createBskyAgent.js';
import { isBskyTokenExpired } from '@/providers/bsky/isBskyTokenExpired.js';
import { retryOnBskyWhenNetworkError } from '@/providers/bsky/retryOnBskyWhenNetworkError.js';
import type { BskySession } from '@/providers/bsky/Session.js';

export async function createBskyAgentAndResume(session: BskySession) {
    const agent = createBskyAgent(session.serviceUrl);
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
        if (!prevSession.refreshJwt) throw new BskySessionExpiredError('no refresh token found');

        try {
            /**
             * try refresh session directly here, because agent.resumeSession catch the error from refreshSession
             * so we need to retry it manually to check if the refresh token is expired
             */
            const res = await retryOnBskyWhenNetworkError(2, () =>
                // @ts-ignore
                agent.sessionManager.server.refreshSession(undefined, {
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
            if (
                err instanceof Error &&
                'error' in err &&
                ['ExpiredToken', 'InvalidToken'].includes(err.error as string)
            ) {
                throw new BskySessionExpiredError(`${err.error}-${err.message}`);
            }

            throw err;
        }
    }

    return agent;
}
