import { first } from 'lodash-es';

import { Source } from '@/constants/enum.js';
import { CHANNEL_REGEX, MENTION_REGEX } from '@/constants/regexp.js';
import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import type { FarcasterProfile, User } from '@/providers/types/Firefly.js';
import type { Profile } from '@/providers/types/SocialMedia.js';

export function parseFarcasterBioContext(bio: string) {
    const mentions = bio.match(MENTION_REGEX);
    const channels = bio.match(CHANNEL_REGEX);
    return {
        mentions: mentions
            ? [...mentions].map((mention) => ({
                  source: Source.Farcaster,
                  id: mention.startsWith('@') ? mention.substring(1) : mention,
              }))
            : [],
        channels: channels ? [...channels].map((channel) => ({ id: channel, name: channel })) : [],
    };
}

export function formatFarcasterProfileFromFirefly(user: User): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        fullHandle: user.username || user.display_name,
        profileId: user.fid.toString(),
        handle: user.username,
        displayName: user.display_name,
        pfp: user.pfp,
        bio: user.bio,
        bioContext: parseFarcasterBioContext(user.bio ?? ''),
        address: first(user.addresses),
        followerCount: user.followers,
        followingCount: user.following,
        viewerContext: {
            following: user.isFollowing,
            followedBy: user.isFollowedBack,
        },
        isPowerUser: user.isPowerUser ?? false,
        isProUser: user.isProUser ?? false,
    };
}

export function formatFarcasterProfileFromFireflyCache(user: FarcasterProfile): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        fullHandle: user.username || user.display_name,
        profileId: user.fid.toString(),
        handle: user.username,
        displayName: user.display_name,
        pfp: user.avatar.url,
        bio: user.bio,
        bioContext: parseFarcasterBioContext(user.bio ?? ''),
        address: first(user.addresses),
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        isPowerUser: user.isPowerUser ?? false,
        isProUser: user.isProUser ?? false,
        viewerContext: {
            following: user.following,
            followedBy: user.followedBy,
        },
    };
}
