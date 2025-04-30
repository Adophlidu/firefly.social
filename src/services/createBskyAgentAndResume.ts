import { AtpAgent, type AtpSessionData } from '@atproto/api';

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

    return agent;
}
