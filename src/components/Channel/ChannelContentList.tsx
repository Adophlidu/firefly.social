'use client';

import { safeUnreachable } from '@masknet/kit';
import { useSuspenseQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { ChannelTrending } from '@/components/Channel/ChannelTrending.js';
import { PostList } from '@/components/Channel/PostList.js';
import { ChannelTabType } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export const ChannelContentList = memo(function ChannelContentList({
    type,
    channel,
}: {
    type: ChannelTabType;
    channel: Channel;
}) {
    const profile = useCurrentProfile(channel.source);
    const { data } = useSuspenseQuery({
        queryKey: ['channel', channel.source, channel.id, profile?.profileId],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: () => runInSafeAsync(() => resolveSocialMediaProvider(channel.source).getChannelById(channel.id)),
    });

    if (!data) return null;

    switch (type) {
        case ChannelTabType.Trending:
            return <ChannelTrending source={data.source} channel={data} />;
        case ChannelTabType.Recent:
            return <PostList source={data.source} channel={data} />;
        default:
            safeUnreachable(type);
            return null;
    }
});
