import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function followBskyProfile(profileId: string): Promise<boolean> {
    await bskySessionHolder.agent.follow(profileId);
    return true;
}
