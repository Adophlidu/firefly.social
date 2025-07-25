import { createBskyAgent } from '@/providers/bsky/createBskyAgent.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import type { BskySession } from '@/providers/bsky/Session.js';

export async function getBskyProfileBySession(session: BskySession, signal?: AbortSignal) {
    const agent = createBskyAgent(session.serviceUrl);
    await agent.resumeSession(session.sessionPayload);
    await agent.sessionManager.refreshSession();

    const response = await agent.getProfile({
        actor: session.did,
    });
    const data = resolveBskyResponseData(response);
    return formatBskyProfile(data);
}
