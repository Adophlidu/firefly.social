import { Source } from '@dimensiondev/enums';
import type { Profile } from '@/providers/types/SocialMedia.js';

// ! only lens now
export function isBadProfile(profile: Profile) {
    if (profile.source !== Source.Lens) return false;

    return !profile.displayName && !profile.pfp && !profile.handle;
}
