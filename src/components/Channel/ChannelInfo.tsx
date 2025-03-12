'use client';

import { useQuery } from '@tanstack/react-query';
import type { HTMLProps } from 'react';

import { ChannelInfoUI } from '@/components/Channel/ChannelInfoUI.js';
import { type SocialSource } from '@/constants/enum.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface InfoProps extends HTMLProps<HTMLDivElement> {
    channel: Channel;
    source: SocialSource;
    isChannelPage?: boolean;
}

export function ChannelInfo({ channel, source, ...rest }: InfoProps) {
    const profile = useCurrentProfile(source);
    const { data, isLoading, isRefetching } = useQuery({
        queryKey: ['channel', channel.source, channel.id, profile?.profileId],
        queryFn: async () => {
            if (channel.__lazy__ && channel.id) {
                return resolveSocialMediaProvider(channel.source).getChannelById(channel.id);
            }

            return channel;
        },
    });

    if (isLoading || isRefetching)
        return (
            <div className="flex animate-pulse gap-3 border-b border-line p-3">
                <div className="h-12 w-12 rounded-full bg-third" />
                <div className="flex-1">
                    <div className="h-6 w-16 bg-third" />
                    <div className="mb-1.5 mt-px h-6 w-20 bg-third" />
                    <div className="h-6 w-2/3 bg-third" />
                </div>
            </div>
        );

    if (!data) return null;

    return <ChannelInfoUI channel={data} source={source} {...rest} />;
}
