import { first } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import type { User } from '@/providers/types/Firefly.js';
import { type Profile } from '@/providers/types/SocialMedia.js';

export function formatFarcasterProfileFromFirefly(user: User): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        fullHandle: user.username || user.display_name,
        profileId: user.fid.toString(),
        handle: user.username,
        displayName: user.display_name,
        pfp: user.pfp,
        bio: user.bio,
        address: first(user.addresses),
        followerCount: user.followers,
        followingCount: user.following,
        viewerContext: {
            following: user.isFollowing,
            followedBy: user.isFollowedBack,
        },
        isPowerUser: user.isPowerUser ?? false,
    };
}
