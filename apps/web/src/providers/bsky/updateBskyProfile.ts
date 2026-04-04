import { type AppBskyActorProfile } from '@atproto/api';
import { has } from 'lodash-es';

import { fetchBlob } from '@/helpers/fetchBlob.js';
import { bskySessionHolder } from '@/providers/bsky/SessionHolder.js';
import { type ProfileEditable } from '@/providers/types/SocialMedia.js';

export async function updateBskyProfile(profile: ProfileEditable, signal?: AbortSignal): Promise<boolean> {
    await bskySessionHolder.agent.upsertProfile(async (existing) => {
        const nextProfileData = (existing || {}) as AppBskyActorProfile.Main;

        if (has(profile, 'displayName')) {
            nextProfileData.displayName = profile.displayName;
        }
        if (has(profile, 'bio')) {
            nextProfileData.description = profile.bio;
        }
        if (profile.pfp) {
            const avatarBlob = await fetchBlob(profile.pfp);
            const avatarBlobUploaded = await bskySessionHolder.agent.uploadBlob(avatarBlob, { signal });
            nextProfileData.avatar = avatarBlobUploaded.data.blob;
        }

        return nextProfileData;
    });
    return true;
}
