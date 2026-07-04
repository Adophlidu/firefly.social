import { Source } from '@dimensiondev/enums';
import { uniqBy } from 'lodash-es';

import { createDummyProfile } from '@/helpers/createDummyProfile.js';
import { parseFarcasterBioContext } from '@/providers/farcaster/formatFarcasterProfileFromFirefly.js';
import type {
    Channel as FireflyChannel,
    ChannelBrief,
    ChannelProfile,
    ChannelProfileBrief,
    FireflyFarcasterProfile,
} from '@/providers/types/Firefly.js';
import { type Channel, type Profile, ProfileStatus } from '@/providers/types/SocialMedia.js';

function formatChannelProfileFromFirefly(channelProfile: ChannelProfile): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        profileId: `${channelProfile.fid}`,
        displayName: channelProfile.display_name,
        handle: channelProfile.username,
        fullHandle: channelProfile.username,
        pfp: channelProfile.pfp_url,
        bio: channelProfile.profile?.bio?.text,
        bioContext: {
            mentions: uniqBy(
                [
                    ...parseFarcasterBioContext(channelProfile.profile?.bio?.text ?? '').mentions,
                    ...(channelProfile.profile?.bio?.mentioned_profiles?.map(({ username }) => ({
                        source: Source.Farcaster,
                        id: username,
                    })) ?? []),
                ],
                (x) => x.id,
            ),
            channels: channelProfile.profile?.bio?.mentioned_channels?.map(({ image_url, id, name }) => ({
                id,
                name,
                imageURL: image_url,
            })),
        },
        address: channelProfile.custody_address,
        followerCount: channelProfile.follower_count,
        followingCount: channelProfile.following_count,
        status: channelProfile.active_status === 'active' ? ProfileStatus.Active : ProfileStatus.Inactive,
        verified: !!channelProfile.verifications && channelProfile.verifications.length > 0,
        viewerContext: {
            following: channelProfile.isFollowing ?? false,
            followedBy: channelProfile.isFollowedBack ?? false,
        },
    };
}

export function formatChannelFromFirefly(channel: FireflyChannel): Channel {
    const createdAt = channel.createdAt ?? channel.created_at ?? 0;

    const formatted: Channel = {
        source: Source.Farcaster,
        id: channel.id,
        name: channel.name,
        description: channel.description,
        imageUrl: channel.image_url,
        url: channel.url,
        parentUrl: channel.parent_url,
        followerCount: channel.follower_count ?? 0,
        timestamp: createdAt * 1000,
    };
    if (channel.lead) {
        formatted.lead = formatChannelProfileFromFirefly(channel.lead);
    }
    if (channel.hosts?.length) {
        formatted.hosts = channel.hosts.map(formatChannelProfileFromFirefly);
    }
    return formatted;
}

function formatBriefChannelProfileFromFirefly(channelProfile: ChannelProfileBrief): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        profileId: `${channelProfile.fid}`,
        displayName: channelProfile.display_name,
        handle: channelProfile.username,
        fullHandle: channelProfile.username,
        pfp: channelProfile.pfp,
        bio: channelProfile.bio,
        bioContext: parseFarcasterBioContext(channelProfile.bio),
        followerCount: channelProfile.followers,
        followingCount: channelProfile.following,
        viewerContext: {
            following: channelProfile.isFollowing,
            followedBy: channelProfile.isFollowedBack,
        },
    };
}

export function formatBriefChannelFromFirefly(channel: ChannelBrief, blocked?: boolean): Channel {
    const createdAt = channel.createdAt ?? channel.created_at ?? 0;

    const formatted: Channel = {
        source: Source.Farcaster,
        id: channel.id,
        name: channel.name,
        description: channel.description,
        url: channel.url,
        parentUrl: channel.parent_url,
        imageUrl: channel.image_url,
        followerCount: channel.follower_count ?? 0,
        timestamp: createdAt * 1000,
        blocked,
    };

    if (channel.lead) {
        formatted.lead = formatBriefChannelProfileFromFirefly(channel.lead);
    }
    return formatted;
}

export function formatFireflyFarcasterProfile(profile: FireflyFarcasterProfile): Profile {
    return {
        ...createDummyProfile(Source.Farcaster),
        profileId: `${profile.fid}`,
        displayName: profile.display_name,
        handle: profile.username,
        fullHandle: profile.username,
        pfp: profile.pfp,
        bio: profile.bio,
        bioContext: parseFarcasterBioContext(profile.bio),
        followerCount: profile.followers,
        followingCount: profile.following,
        viewerContext: {
            following: profile.isFollowing,
            followedBy: profile.isFollowedBack,
        },
        isProUser: profile.isProUser ?? false,
    };
}
