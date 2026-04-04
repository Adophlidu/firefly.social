import { assert } from '@dimensiondev/utils';

import { Source } from '@/constants/enum.js';
import { TWITTER_MENTION_REGEX } from '@/constants/regexp.js';
import { type RootdataPeople } from '@/providers/types/Firefly.js';
import { type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

export function formatTwitterProfileFromRootdata(user: RootdataPeople): Profile<RootdataPeople> {
    assert(user.people_detail?.x_id, '.people_detail.x_id of rootdata user is required');
    const bio = user.people_detail.introduce || user.people_detail.one_liner;
    return {
        profileId: user.people_detail.x_id,
        profileSource: Source.Twitter,
        displayName: user.people_name,
        handle: user.people_detail.people_x_handle,
        fullHandle: user.people_name,
        pfp: user.head_img,
        bio,
        bioContext: {
            mentions: [...user.people_detail.introduce?.matchAll(TWITTER_MENTION_REGEX)].map((x) => ({
                source: Source.Twitter,
                id: x[1],
            })),
        },
        followerCount: user.people_detail.followers,
        followingCount: user.people_detail.followers,
        status: ProfileStatus.Active,
        verified: true,
        source: Source.Twitter,
        __original__: user,
    };
}
