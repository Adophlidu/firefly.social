import { Source } from '@/constants/enum.js';
import { SessionExpiredError } from '@/constants/error.js';
import { createPublicBskyAgent } from '@/providers/bsky/createBskyAgent.js';
import type { BskySession } from '@/providers/bsky/Session.js';

export async function refreshBskySession(oldSession: BskySession) {
    const agent = createPublicBskyAgent(oldSession.serviceUrl);
    try {
        const refreshJwt = oldSession.sessionPayload.refreshJwt;
        if (!refreshJwt) {
            throw new Error('No refreshJwt available in the session');
        }

        const res = await agent.com.atproto.server.refreshSession(undefined, {
            headers: { authorization: `Bearer ${refreshJwt}` },
        });
        if (!res?.data?.accessJwt) {
            throw new Error('Failed to refresh bsky session: No accessJwt in response');
        }

        return res.data;
    } catch (err) {
        if (err instanceof Error && 'error' in err && ['ExpiredToken', 'InvalidToken'].includes(err.error as string)) {
            throw new SessionExpiredError(Source.Bsky, `${err.error}-${err.message}`);
        }

        throw err;
    }
}
