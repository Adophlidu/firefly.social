import { createPublicBskyAgent } from '@/providers/bsky/createBskyAgent.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { getPdsUrlFromSession } from '@/providers/bsky/getPdsUrlFromSession.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import type { BskySession } from '@/providers/bsky/Session.js';

export async function getBskyProfileBySession(session: BskySession, signal?: AbortSignal) {
    const pdsUrl = getPdsUrlFromSession(session);
    const agent = createPublicBskyAgent(pdsUrl || session.serviceUrl);

    const response = await agent.getProfile({
        actor: session.did,
    });
    const data = resolveBskyResponseData(response);
    return formatBskyProfile(data);
}
