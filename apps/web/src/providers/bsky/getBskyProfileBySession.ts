import { createBskyPublicAgent } from '@/providers/bsky/createBskyAgent.js';
import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { getPdsServiceUrlFromSession } from '@/providers/bsky/getPdsServiceUrlFromSession.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import type { BskySession } from '@/providers/bsky/Session.js';

export async function getBskyProfileBySession(session: BskySession, signal?: AbortSignal) {
    const agent = createBskyPublicAgent(getPdsServiceUrlFromSession(session));
    const response = await agent.getProfile(
        {
            actor: session.did,
        },
        {
            signal,
        },
    );
    const data = resolveBskyResponseData(response);
    return formatBskyProfile(data);
}
