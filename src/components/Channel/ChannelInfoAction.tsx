'use client';

import { classNames } from '@firefly/utils';
import { useQuery } from '@tanstack/react-query';

import { ChannelMoreAction } from '@/components/Channel/ChannelMoreAction.js';
import { ToggleFollowChannelButton } from '@/components/Channel/ToggleFollowChannelButton.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface ChannelInfoActionProps extends React.HTMLAttributes<HTMLDivElement> {
    channel: Channel;
    needRefetch?: boolean;
}

export function ChannelInfoAction({ channel: defaultChannel, className, needRefetch = true }: ChannelInfoActionProps) {
    const profile = useCurrentProfile(defaultChannel.source);
    const { data, isLoading } = useQuery({
        queryKey: ['channel', defaultChannel.source, defaultChannel.id, profile?.profileId],
        enabled: !!profile && needRefetch,
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            const channel = await resolveSocialMediaProvider(defaultChannel.source).getChannelById(
                defaultChannel.id,
                true,
            );
            return channel;
        },
    });

    return (
        <div className={classNames('flex items-center gap-2', className)}>
            <ToggleFollowChannelButton
                needRefetch={!needRefetch}
                loading={isLoading}
                channel={data || defaultChannel}
            />
            <ChannelMoreAction channel={data || defaultChannel} />
        </div>
    );
}
