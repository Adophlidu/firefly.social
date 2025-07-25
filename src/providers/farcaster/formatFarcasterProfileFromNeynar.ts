import { first, uniqBy } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { parseFarcasterBioContext } from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import { NeynarProStatus, type Profile as NeynarProfile } from '@/providers/types/Neynar.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function formatFarcasterProfileFromNeynar(user: NeynarProfile): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        fullHandle: user.username,
        profileId: user.fid.toString(),
        handle: user.username,
        displayName: user.display_name,
        pfp: user.pfp_url,
        bio: user.profile.bio.text,
        bioContext: {
            mentions: uniqBy(
                [
                    ...parseFarcasterBioContext(user.profile.bio.text).mentions,
                    ...(user.profile.bio.mentioned_profiles?.map(({ username }) => ({
                        source: Source.Farcaster,
                        id: username,
                    })) ?? []),
                ],
                (x) => x.id,
            ),
            channels: user.profile.bio.mentioned_channels?.map(({ image_url, id, name }) => ({
                id,
                name,
                imageURL: image_url,
            })),
        },
        address: first(user.verifications),
        followerCount: user.follower_count,
        followingCount: user.following_count,
        status: user.active_status,
        verified: user.power_badge,
        isProUser: user.pro?.status === NeynarProStatus.Subscribed,
        viewerContext: {
            following: user.viewer_context?.following,
            followedBy: user.viewer_context?.followed_by,
        },
    };
}
