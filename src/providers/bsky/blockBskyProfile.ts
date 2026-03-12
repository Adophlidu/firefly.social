import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function blockBskyProfile(profileId: string, signal?: AbortSignal): Promise<boolean> {
    const response = await bskySessionHolder.agent.app.bsky.graph.muteActor({ actor: profileId }, { signal });
    return response.success;
}
