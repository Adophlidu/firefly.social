import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function unblockBskyProfile(profileId: string, signal?: AbortSignal): Promise<boolean> {
    const response = await bskySessionHolder.agent.app.bsky.graph.unmuteActor({ actor: profileId }, { signal });
    return response.success;
}
