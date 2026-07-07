import type { Profile } from '@/providers/types/SocialMedia.js';

/** Whitelist: only listed fields survive. Add any new rendered field here, or it'll be
 *  missing from SSR (ProfileContextProvider refetches the full profile after hydration). */
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
        fifaCampCountryCode: profile.fifaCampCountryCode,
        fifaCampCountryLogo: profile.fifaCampCountryLogo,
    };
}
