import { safeUnreachable } from '@masknet/kit';

import { type ProfileCategory, type ProfilePageSource, Source } from '@/constants/enum.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';

/**
 * Get the profile URL based on the source and handle/profileId.
 * @param profile - The profile object containing source, handle, and profileId.
 * @param profile.source - The source of the profile (e.g., Lens, Farcaster, Twitter, etc.).
 * @param profile.profileId - required for Wallet and WalletMix.
 * @param profile.handle - required for Lens, Farcaster, Twitter, and Bsky.
 * @returns The profile URL as a string.
 */
export function getProfileUrl(
    profile: { source: ProfilePageSource; profileId?: string; handle?: string },
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
        default:
            safeUnreachable(profile.source);
            return '';
    }
}
