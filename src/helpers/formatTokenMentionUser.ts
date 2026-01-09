import { Source } from '@/constants/enum.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';
import { type TokenMentionUser } from '@/providers/x3pro/types.js';

export function formatTokenMentionUser(x: TokenMentionUser): Profile<TokenMentionUser> {
    return {
        source: Source.Twitter,
        profileId: x.twitterId,
        profileSource: Source.Twitter,
        displayName: x.name,
        handle: x.screenName,
        fullHandle: x.screenName,
        pfp: x.avatar,
        verified: false,
        followerCount: x.fanCount,
        followingCount: 0,
        status: ProfileStatus.Active,

        __original__: x,
    };
}
