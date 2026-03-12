import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function isBskyFollowedByMe(profileId: string, signal?: AbortSignal): Promise<boolean> {
    const response = await bskySessionHolder.agent.getProfile(
        {
            actor: profileId,
        },
        { signal },
    );
    return !!response.data.viewer?.following;
}
