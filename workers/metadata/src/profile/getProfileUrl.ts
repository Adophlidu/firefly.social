import type { ProfileCategory, ProfilePageSource } from '@dimensiondev/enums';
import { Source } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/workers-shared/helpers/unreachable.js';

import { resolveProfileUrl } from '@/metadata/src/profile/resolveProfileUrl.js';

/**
 * Get the profile URL based on the source and handle/profileId.
 * @param profile - The profile object containing source, handle, and profileId.
 * @param profile.source - The source of the profile (e.g., Lens, Farcaster, Twitter, etc.).
 * @param profile.profileId - required for Wallet and WalletMix.
 * @param profile.handle - required for Lens, Farcaster, Twitter, and Bsky.
 * @returns The profile URL as a string.
 */
export function getProfileUrl(
    profile: { source: ProfilePageSource | Source.Firefly; profileId?: string; handle?: string },
    category?: ProfileCategory,
    isCurrentProfile?: boolean,
) {
    switch (profile.source) {
        case Source.Lens:
        case Source.Farcaster:
        case Source.Twitter:
        case Source.Bsky:
            if (!profile.handle) return '';
            return resolveProfileUrl(profile.source, profile.handle, category, isCurrentProfile);
        case Source.Wallet:
        case Source.WalletMix:
            if (!profile.profileId) return '';
            return resolveProfileUrl(profile.source, profile.profileId, category, isCurrentProfile);
        case Source.Firefly:
            if (!profile.profileId) return '';
            return `/profile/${profile.profileId}`;
        default:
            safeUnreachable(profile.source);
            return '';
    }
}
