'use client';

import LikeIcon from '@dimensiondev/assets/heart.svg';
import UserIcon from '@dimensiondev/assets/user.svg';
import { Trans } from '@lingui/react/macro';
import { memo, type MouseEvent, useCallback } from 'react';

import { Avatar } from '@/components/Avatar.js';
import { ToggleFollowChannelButton } from '@/components/Channel/ToggleFollowChannelButton.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import { Source } from '@/constants/enum.js';
import { useRouter } from '@/esm/navigation.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { getChannelUrl } from '@/helpers/getChannelUrl.js';
import { type Channel } from '@/providers/types/SocialMedia.js';

interface ChannelCardProps {
    channel?: Channel | null;
    loading?: boolean;
}

export const ChannelCard = memo<ChannelCardProps>(function ChannelCard({ channel, loading }) {
    const router = useRouter();

    const handleNavigateToDetail = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            event.stopPropagation();
            event.preventDefault();
            if (!channel) return;
            router.push(getChannelUrl(channel));
        },
        [channel, router],
    );

    if (loading) {
        return (
            <div className="border-secondaryLine bg-primaryBottom w-[350px] rounded-2xl border p-4">
                <div className="animate-pulse">
                    <div className="flex w-full gap-2.5">
                        <div className="bg-third size-20 rounded-full" />
                        <div className="flex flex-1 flex-col justify-between">
                            <div className="bg-third h-3 w-[120px] rounded" />
                            <div className="bg-third h-3 w-[120px] rounded" />
                            <div className="bg-third h-3 w-[120px] rounded" />
                        </div>
                    </div>
                    <div className="mt-3 space-y-4">
                        <div className="bg-third h-3 w-full rounded" />
                        <div className="bg-third h-3 w-full rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!channel) return;

    const followerCount = channel.followerCount ?? 0;
    const isBsky = channel.source === Source.Bsky;
    const isLens = channel.source === Source.Lens;

    return (
        <div className="border-secondaryLine bg-primaryBottom w-[350px] rounded-2xl border p-4">
            <div className="flex gap-2.5">
                {channel.imageUrl ? (
                    <Avatar
                        src={channel.imageUrl}
                        alt="avatar"
                        size={50}
                        onClick={handleNavigateToDetail}
                        className="size-[50px] cursor-pointer rounded-full"
                    />
                ) : (
                    <SocialSourceIcon className="rounded-full" source={channel.source} size={50} />
                )}

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-center gap-[6px] whitespace-nowrap">
                        <span
                            onClick={handleNavigateToDetail}
                            className="text-lightMain cursor-pointer overflow-auto truncate text-lg font-bold"
                        >
                            {channel.name}
                        </span>
                        <SocialSourceIcon source={channel.source} className="shrink-0" size={18} />
                    </div>
                    <div
                        onClick={handleNavigateToDetail}
                        className="text-medium text-secondary flex cursor-pointer items-center gap-2"
                    >
                        {isBsky || isLens ? (
                            channel.lead?.handle ? (
                                <span className="min-w-0 truncate whitespace-nowrap">
                                    <Trans>By @{channel.lead?.handle || '-'}</Trans>
                                </span>
                            ) : null
                        ) : (
                            <span className="min-w-0 truncate whitespace-nowrap">/{channel.id}</span>
                        )}
                        <div className="flex items-center gap-2">
                            {!isBsky ? <UserIcon width={18} height={18} /> : <LikeIcon className="text-secondary" />}
                            <data value={followerCount} className="text-medium text-lightMain leading-6">
                                {nFormatter(followerCount)}
                            </data>
                        </div>
                    </div>
                </div>
            </div>

            <div onClick={handleNavigateToDetail}>
                <BioMarkup
                    className="text-medium text-lightMain mt-3 line-clamp-2 leading-[22px]"
                    source={channel.source}
                >
                    {channel.description ?? '-'}
                </BioMarkup>
            </div>

            <ToggleFollowChannelButton needRefetch channel={channel} className="mt-3 w-full rounded-lg" />
        </div>
    );
});
