import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function isBskyFollowingMe(profileId: string, signal?: AbortSignal): Promise<boolean> {
    const response = await bskySessionHolder.agent.getProfile(
        {
            actor: profileId,
        },
        { signal },
    );
    return !!response.data.viewer?.followedBy;
}
