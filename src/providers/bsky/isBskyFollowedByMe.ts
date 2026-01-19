import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function isBskyFollowedByMe(profileId: string): Promise<boolean> {
    const response = await bskySessionHolder.agent.getProfile({
        actor: profileId,
    });
    return !!response.data.viewer?.following;
}
