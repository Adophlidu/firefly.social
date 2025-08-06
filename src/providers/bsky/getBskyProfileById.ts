import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';

export async function getBskyProfileById(profileId: string) {
    const response = await bskySessionHolder.agent.getProfile({ actor: profileId });
    const data = resolveBskyResponseData(response, `Failed to get profile id = ${profileId}.`);
    return formatBskyProfile(data);
}
