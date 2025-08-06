import { getProfileFromStorage } from '@/helpers/getProfileFromStorage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function isCurrentProfile(profile: Profile) {
    const currentProfile = getProfileFromStorage(profile.source);
    if (!currentProfile) return false;
    return isSameProfile(profile, currentProfile);
}
