import { getCurrentProfileFromStorage } from '@/helpers/getCurrentProfileFromStorage.js';
import { isSameProfile } from '@/helpers/isSameProfile.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export function isCurrentProfile(profile: Profile) {
    const currentProfile = getCurrentProfileFromStorage(profile.source);
    if (!currentProfile) return false;
    return isSameProfile(profile, currentProfile);
}
