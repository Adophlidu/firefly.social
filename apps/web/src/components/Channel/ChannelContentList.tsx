'use client';

import { ChannelTabType } from '@dimensiondev/enums';
import { safeUnreachable } from '@dimensiondev/utils';
import { memo } from 'react';

import { ChannelFollowerList } from '@/components/Channel/ChannelFollowerList.js';
import { ChannelMemberList } from '@/components/Channel/ChannelMemberList.js';
import { PostList } from '@/components/Channel/PostList.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export const ChannelContentList = memo(function ChannelContentList({
    type,
    channel,
}: {
    type: ChannelTabType;
    channel: Channel;
}) {
    switch (type) {
        case ChannelTabType.Posts:
            return <PostList source={channel.source} channel={channel} />;
        case ChannelTabType.Members:
            return <ChannelMemberList channelId={channel.id} source={channel.source} />;
        case ChannelTabType.Followers:
            return <ChannelFollowerList channelId={channel.id} source={channel.source} />;
        default:
            safeUnreachable(type);
            return null;
    }
});
