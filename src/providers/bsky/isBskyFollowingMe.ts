import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function isBskyFollowingMe(profileId: string): Promise<boolean> {
    const response = await bskySessionHolder.agent.getProfile({
        actor: profileId,
    });
    return !!response.data.viewer?.followedBy;
}
