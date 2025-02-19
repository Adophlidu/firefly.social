import { formatBskyProfile } from '@/helpers/formatBskyProfile.js';
import { resolveBskyResponseData } from '@/helpers/resolveBskyResponseData.js';
import type { BskySession } from '@/providers/bsky/Session.js';
import { createAgent } from '@/providers/bsky/SessionHolder.js';

export async function getBskyProfileBySession(session: BskySession, signal?: AbortSignal) {
    const agent = createAgent(session.serviceUrl);
    await agent.resumeSession(session.sessionPayload);

    const response = await agent.getProfile({
        actor: session.did,
    });
    const data = resolveBskyResponseData(response);
    return formatBskyProfile(data);
}
