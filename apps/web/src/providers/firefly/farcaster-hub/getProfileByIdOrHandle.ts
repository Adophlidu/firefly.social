import { isNumericalProfileId } from '@/helpers/isNumericalProfileId.js';
import { getProfileByHandle } from '@/providers/firefly/farcaster-hub/getProfileByHandle.js';
import { getProfileById } from '@/providers/firefly/farcaster-hub/getProfileById.js';
import type { Notification, Profile } from '@/providers/types/SocialMedia.js';

export async function getProfileByIdOrHandle(profileIdOrHandle: string): Promise<Profile> {
    if (isNumericalProfileId(profileIdOrHandle)) return getProfileById(profileIdOrHandle);
    return getProfileByHandle(profileIdOrHandle);
}
