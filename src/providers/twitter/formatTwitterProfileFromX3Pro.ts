import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { X3_PRO_AVATAR_URL } from '@/constants/index.js';
import { TWITTER_MENTION_REGEX } from '@/constants/regexp.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { ProfileStatus } from '@/providers/types/SocialMedia.js';
import { formatX3Id } from '@/providers/x3pro/formatX3Id.js';
import type { Profile as X3ProProfile } from '@/providers/x3pro/types.js';

export function formatTwitterProfileFromX3Pro(user: X3ProProfile): Profile<X3ProProfile> {
    const bio = user.introLinks?.reduce(
        (b, interLink) => b.replace(interLink.shortUrl, interLink.realUrl),
        user.introduction,
    );
    return {
        profileId: formatX3Id(user.id),
        profileSource: Source.Twitter,
        displayName: user.name,
        handle: user.screenName,
        fullHandle: user.screenName,
        pfp: urlcat(X3_PRO_AVATAR_URL, user.avatar),
        bio,
        bioContext: {
            mentions: [...user.introduction?.matchAll(TWITTER_MENTION_REGEX)].map((x) => ({
                source: Source.Twitter,
                id: x[1],
            })),
        },
        followerCount: user.fanCount,
        followingCount: user.focusCount,
        status: ProfileStatus.Active,
        verified: true,
        source: Source.Twitter,
        website: user.introLinks?.[0]?.realUrl || user.homeRealUrl,
        __original__: user,
    };
}
