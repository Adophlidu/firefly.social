'use client';

import { Source } from '@dimensiondev/enums';
import { Plural } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';

import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface ChannelFollowerCountProps {
    channel: Channel;
}

export function ChannelFollowerCount({ channel }: ChannelFollowerCountProps) {
    const profile = useCurrentProfile(channel.source);

    // watching the follower count
    const { data } = useQuery<Channel>({
        queryKey: ['channel', channel.source, channel.id, profile?.profileId],
    });

    const followerCount = data?.followerCount || channel.followerCount || 0;

    return (
        <data value={followerCount} className="flex items-center gap-1">
            <span className="text-lightMain">{nFormatter(followerCount)}</span>
            <span className="text-secondary">
                {channel.source === Source.Bsky ? (
                    <Plural value={followerCount} one="Like" other="Likes" />
                ) : channel.source === Source.Farcaster ? (
                    <Plural value={followerCount} one="Follower" other="Followers" />
                ) : (
                    <Plural value={followerCount} one="Member" other="Members" />
                )}
            </span>
        </data>
    );
}
