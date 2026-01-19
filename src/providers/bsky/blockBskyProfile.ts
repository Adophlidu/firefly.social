import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function blockBskyProfile(profileId: string): Promise<boolean> {
    const response = await bskySessionHolder.agent.mute(profileId);
    return response.success;
}
