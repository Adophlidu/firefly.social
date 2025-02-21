import { formatBskyProfile } from '@/helpers/formatBskyProfile.js';
import { resolveBskyResponseData } from '@/helpers/resolveBskyResponseData.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { createAgentOnce } from '@/providers/bsky/SessionHolder.js';

export async function getBskyProfileBySession(session: BskySession, signal?: AbortSignal) {
    const agent = createAgentOnce(session.serviceUrl);
    await agent.resumeSession(session.sessionPayload);
    await agent.sessionManager.refreshSession();

    const response = await agent.getProfile({
        actor: session.did,
    });
    const data = resolveBskyResponseData(response);
    return formatBskyProfile(data);
}
