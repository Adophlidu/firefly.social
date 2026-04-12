import { formatBskyProfile } from '@/providers/bsky/formatBskyProfile.js';
import { resolveBskyResponseDataAsync } from '@/providers/bsky/resolveBskyResponseData.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export async function getBskyProfileById(profileId: string, signal?: AbortSignal): Promise<Profile> {
    const data = await resolveBskyResponseDataAsync(
        () => bskySessionHolder.agent.getProfile({ actor: profileId }, { signal }),
        `Failed to get profile id = ${profileId}.`,
    );
    return formatBskyProfile(data);
}
