import type { Profile } from '@/providers/types/SocialMedia.js';

/** Drop heavy nested fields before passing profile data through the RSC client boundary. */
export function compactProfileForPageTransfer(profile: Profile): Profile {
    return {
        profileId: profile.profileId,
        profileSource: profile.profileSource,
        source: profile.source,
        displayName: profile.displayName,
        handle: profile.handle,
        fullHandle: profile.fullHandle,
        pfp: profile.pfp,
        bio: profile.bio,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        status: profile.status,
        verified: profile.verified,
        protected: profile.protected,
        signless: profile.signless,
        viewerContext: profile.viewerContext,
        isProUser: profile.isProUser,
        canFollow: profile.canFollow,
        canUnfollow: profile.canUnfollow,
        highlighted: profile.highlighted,
        fifaCampCountryCode: profile.fifaCampCountryCode,
        fifaCampCountryLogo: profile.fifaCampCountryLogo,
    };
}
