import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { parseFarcasterBioContext } from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import { type FarcasterSuggestedFollowUser } from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export function formatFarcasterProfileFromSuggestedFollow(user: FarcasterSuggestedFollowUser): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        followerCount: user.followers,
        followingCount: user.following,
        fullHandle: user.username,
        profileId: `${user.fid}`,
        handle: user.username,
        displayName: user.display_name,
        pfp: user.pfp,
        bio: user.bio,
        bioContext: parseFarcasterBioContext(user.bio),
        viewerContext: {
            following: user.isFollowing,
            followedBy: user.isFollowedBack,
        },
        verified: false,
    };
}
