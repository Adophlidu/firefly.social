import { createPublicBskyAgent } from '@/providers/bsky/createBskyAgent.js';
import { refreshBskySession } from '@/providers/bsky/refreshBskySession.js';
import { retryOnBskyWhenNetworkError } from '@/providers/bsky/retryOnBskyWhenNetworkError.js';
import { BskySession } from '@/providers/bsky/Session.js';

export async function ensureBskySessionIsValid(session: BskySession) {
    const agent = createPublicBskyAgent(session.serviceUrl);

    try {
        const serverSession = await retryOnBskyWhenNetworkError(2, async () => {
            return agent.com.atproto.server.getSession(undefined, {
                headers: { authorization: `Bearer ${session.sessionPayload.accessJwt}` },
            });
        });
        return new BskySession(session.did, session.createdAt, session.expiresAt, session.serviceUrl, {
            ...session.sessionPayload,
            active: serverSession.data.active ?? true,
            didDoc: serverSession.data.didDoc,
        });
    } catch (err) {
        if (err instanceof Error && 'error' in err && ['ExpiredToken', 'InvalidToken'].includes(err.error as string)) {
            const newSession = await retryOnBskyWhenNetworkError(2, () => refreshBskySession(session));
            return newSession;
        }

        throw err;
    }
}
