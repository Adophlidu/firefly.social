import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function unfollowBskyProfile(profileId: string): Promise<boolean> {
    const response = await bskySessionHolder.agent.getProfile({
        actor: profileId,
    });
    const data = resolveBskyResponseData(response, `Failed to unfollow profileId = ${profileId}`);
    const followUri = data.viewer?.following;
    if (!followUri) throw new Error(`No follow uri found profileId = ${profileId}`);

    await bskySessionHolder.agent.deleteFollow(followUri);
    return true;
}
