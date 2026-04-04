'use client';

import { useQuery } from '@tanstack/react-query';
import { type HTMLProps } from 'react';

import { ChannelInfoUI } from '@/components/Channel/ChannelInfoUI.js';
import { type SocialSource } from '@/constants/enum.js';
import { STALE_TIMES } from '@/constants/query.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { type Channel } from '@/providers/types/SocialMedia.js';

interface InfoProps extends HTMLProps<HTMLDivElement> {
    channel: Channel;
    source: SocialSource;
    isChannelPage?: boolean;
}

export function ChannelInfo({ channel, source, ...rest }: InfoProps) {
    const profile = useCurrentProfile(source);

    const needRefetch = !!(channel.__lazy__ && channel.id);
    const { data = channel } = useQuery({
        queryKey: ['channel', channel.source, channel.id, profile?.profileId],
        staleTime: STALE_TIMES.MINUTE_10,

        queryFn: async () => {
            if (!needRefetch) return channel;
            return resolveSocialMediaProvider(channel.source).getChannelById(channel.id);
        },
    });

    if (!data) return null;

    return <ChannelInfoUI needRefetch={!needRefetch} channel={data} source={source} {...rest} />;
}
