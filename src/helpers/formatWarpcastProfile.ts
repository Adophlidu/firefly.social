import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import type { Profile as WarpProfile } from '@/providers/types/Warpcast.js';

export function formatWarpcastProfile(profile: WarpProfile): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        profileId: profile.fid.toString(),
        displayName: profile.displayName,
        handle: profile.username,
        fullHandle: profile.username,
        pfp: profile.pfp?.url,
        bio: profile.profile.bio.text,
        address: profile.profile.location.description,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
        verified: profile.pfp ? profile.pfp.verified : false,
        viewerContext: {
            following: profile.viewerContext.following,
            followedBy: profile.viewerContext.followedBy,
        },
    };
}
