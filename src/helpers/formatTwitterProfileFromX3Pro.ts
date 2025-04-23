import urlcat from 'urlcat';

import { Source } from '@/constants/enum.js';
import { X3_PRO_AVATAR_URL } from '@/constants/index.js';
import type { Profile } from '@/providers/types/SocialMedia.js';
import { ProfileStatus } from '@/providers/types/SocialMedia.js';
import type { Profile as X3ProProfile } from '@/providers/x3pro/index.js';

export function formatTwitterProfileFromX3Pro(user: X3ProProfile): Profile<X3ProProfile> {
    const idPrefix = 'x_';
    const profileId = user.id.startsWith(idPrefix) ? user.id.substring(idPrefix.length) : user.id;
    return {
        profileId,
        profileSource: Source.Twitter,
        displayName: user.name,
        handle: user.screenName,
        fullHandle: user.screenName,
        pfp: urlcat(X3_PRO_AVATAR_URL, user.avatar),
        bio: user.introduction,
        followerCount: user.fanCount,
        followingCount: user.focusCount,
        status: ProfileStatus.Active,
        verified: true,
        source: Source.Twitter,
        website: user.introLinks?.[0]?.realUrl || user.homeRealUrl,
        __original__: user,
    };
}
