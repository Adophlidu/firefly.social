import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { getTwitterNitterPicUrl } from '@/helpers/getTwitterNitterPicUrl.js';
import { type User, UserVerifiedType } from '@/providers/types/Nitter.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function formatTwitterProfileFromNitter(user: User): Profile {
    return {
        ...createDummyProfile(Source.Twitter),
        profileId: user.id ?? user.username,
        handle: user.username,
        fullHandle: user.username,
        displayName: user.fullname,
        pfp: getTwitterNitterPicUrl(user.userPic),
        bio: user.bio,
        followerCount: user.followers,
        followingCount: user.following,
        verified: user.verifiedType !== UserVerifiedType.None,
        website: user.website,
        location: user.location,
    };
}
