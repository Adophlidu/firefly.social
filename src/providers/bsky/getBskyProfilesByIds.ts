import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { resolveBskyResponseData } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export async function getBskyProfilesByIds(ids: string[]): Promise<Profile[]> {
    const response = await bskySessionHolder.agent.getProfiles({ actors: ids });
    const data = resolveBskyResponseData(response, `Failed to get profiles ids = ${ids.join(',')}.`);
    return data.profiles.map((profile) => formatBskyProfile(profile));
}
