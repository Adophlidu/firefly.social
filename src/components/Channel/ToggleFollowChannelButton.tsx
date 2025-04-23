'use client';

import { t } from '@lingui/core/macro';
import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { useAsyncFn } from 'react-use';

import type { ClickableButtonProps } from '@/components/ClickableButton.js';
import { ToggleJoinButton } from '@/components/ToggleJoinButton.js';
import { Source } from '@/constants/enum.js';
import { enqueueErrorMessage, enqueueSuccessMessage } from '@/helpers/enqueueMessage.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceName } from '@/helpers/resolveSourceName.js';
import { useCurrentProfile } from '@/hooks/useCurrentProfile.js';
import { LoginModalRef } from '@/modals/controls.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

interface ToggleFollowChannelButtonProps extends ClickableButtonProps {
    channel: Channel;
    needRefetch?: boolean;
}

function getFollowSuccessMessage(channel: Channel, isFollowing: boolean) {
    const sourceName = resolveSourceName(channel.source);

    switch (channel.source) {
        case Source.Bsky:
            return `${isFollowing ? 'Removed' : 'Added'} #${channel.name} on ${sourceName}`;
        case Source.Lens:
            return `${isFollowing ? 'Left' : 'Joined'} #${channel.name} on ${sourceName}`;
        default:
            return `${isFollowing ? 'Unfollowed' : 'Followed'} /${channel.id} on ${sourceName}`;
    }
}

function getFollowErrorMessage(channel: Channel, isFollowing: boolean) {
    const sourceName = resolveSourceName(channel.source);

    switch (channel.source) {
        case Source.Bsky:
            return `Failed to ${isFollowing ? 'remove' : 'add'} #${channel.name} on ${sourceName}`;
        case Source.Lens:
            return `Failed to ${isFollowing ? 'leave' : 'join'} #${channel.name} on ${sourceName}`;
        default:
            return `Failed to ${isFollowing ? 'unfollow' : 'follow'} /${channel.id} on ${sourceName}`;
    }
}

export const ToggleFollowChannelButton = memo<ToggleFollowChannelButtonProps>(function ToggleFollowChannelButton({
    channel: defaultChannel,
    needRefetch,
    ...rest
}) {
    const profile = useCurrentProfile(defaultChannel.source);

    const enabled = [Source.Farcaster, Source.Bsky, Source.Lens].includes(defaultChannel.source);

    const { data: channel = defaultChannel, isLoading } = useQuery({
        queryKey: ['channel', defaultChannel.source, defaultChannel.id, profile?.profileId],
        enabled: needRefetch && !!profile?.profileId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            const channel = await resolveSocialMediaProvider(defaultChannel.source).getChannelById(
                defaultChannel?.id,
                true,
                defaultChannel.ownerId,
            );
            return channel;
        },
    });

    const isFollowing = !!channel.isMember;
    const isBsky = channel.source === Source.Bsky;
    const isLens = channel.source === Source.Lens;

    const [{ loading }, toggleFollow] = useAsyncFn(async () => {
        if (!profile?.profileId) {
            LoginModalRef.open({ source: channel.source });
            return;
        }

        try {
            const provider = resolveSocialMediaProvider(channel.source);
            const result = isFollowing ? await provider.leaveChannel(channel) : await provider.joinChannel(channel);
            if (!result) {
                throw new Error('Failed to toggle follow channel');
            }

            enqueueSuccessMessage(getFollowSuccessMessage(channel, isFollowing));
        } catch (error) {
            enqueueErrorMessage(getFollowErrorMessage(channel, isFollowing), {
                error,
            });
            throw error;
        }
    }, [channel, isFollowing, profile?.profileId]);

    if (!enabled || (!isLoading && isLens && !channel.canJoin && !channel.canLeave)) return null;

    return (
        <ToggleJoinButton
            {...rest}
            loading={loading || isLoading}
            joined={!!channel.isMember}
            joinLabel={isBsky ? t`Add` : isLens ? t`Join` : t`Follow`}
            joinedLabel={isBsky ? t`Added` : isLens ? t`Joined` : t`Following`}
            leaveLabel={isBsky ? t`Remove` : isLens ? t`Leave` : t`Unfollow`}
            onClick={toggleFollow}
        />
    );
});
