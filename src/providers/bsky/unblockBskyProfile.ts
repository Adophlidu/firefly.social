import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function unblockBskyProfile(profileId: string): Promise<boolean> {
    const response = await bskySessionHolder.agent.unmute(profileId);
    return response.success;
}
