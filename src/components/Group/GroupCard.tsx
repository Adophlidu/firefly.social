import { Trans } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation.js';
import { memo, type MouseEvent, useCallback } from 'react';

import UserIcon from '@/assets/user.svg';
import { Avatar } from '@/components/Avatar.js';
import { BioMarkup } from '@/components/Markup/BioMarkup.js';
import { SocialSourceIcon } from '@/components/SocialSourceIcon.js';
import type { SocialSource } from '@/constants/enum.js';
import { nFormatter } from '@/helpers/formatCommentCounts.js';
import { resolveGroupPageUrl } from '@/helpers/resolveGroupPageUrl.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';

interface GroupCardProps {
    groupId: string;
    source: SocialSource;
    group?: ProfileGroup;
}

export const GroupCard = memo(function GroupCard({ groupId, group: defaultGroup, source }: GroupCardProps) {
    const { data: group = defaultGroup, isLoading } = useQuery({
        queryKey: ['group', source, groupId],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            return LensSocialMediaProvider.getGroupById(groupId);
        },
    });
    const { data: followerCount = 0 } = useQuery({
        queryKey: ['group', 'members-count', groupId],
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            return LensSocialMediaProvider.getGroupMembersCount(groupId);
        },
    });
    const { data: ownerProfile } = useQuery({
        queryKey: ['profile', source, group?.ownerProfileId],
        enabled: !!group?.ownerProfileId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        queryFn: async () => {
            if (!group?.ownerProfileId) return;
            return resolveSocialMediaProvider(source).getProfileById(group.ownerProfileId);
        },
    });

    const router = useRouter();
    const handleNavigateToDetail = useCallback(
        (event: MouseEvent<HTMLDivElement>) => {
            event.stopPropagation();
            event.preventDefault();
            if (!group) return;
            router.push(resolveGroupPageUrl(groupId));
        },
        [groupId, group, router],
    );

    if (isLoading && !group) {
        return (
            <div className="w-[350px] rounded-2xl border border-secondaryLine bg-primaryBottom p-4">
                <div className="animate-pulse">
                    <div className="flex w-full gap-[10px]">
                        <div className="size-20 rounded-full bg-third" />
                        <div className="flex flex-1 flex-col justify-between">
                            <div className="h-3 w-[120px] rounded bg-third" />
                            <div className="h-3 w-[120px] rounded bg-third" />
                            <div className="h-3 w-[120px] rounded bg-third" />
                        </div>
                    </div>
                    <div className="mt-3 space-y-4">
                        <div className="h-3 w-full rounded bg-third" />
                        <div className="h-3 w-full rounded bg-third" />
                    </div>
                </div>
            </div>
        );
    }

    if (!group) return;

    return (
        <div className="w-[350px] rounded-2xl border border-secondaryLine bg-primaryBottom p-4">
            <div className="flex gap-[10px]">
                {group.imageUrl ? (
                    <Avatar
                        src={group.imageUrl}
                        alt="avatar"
                        size={80}
                        onClick={handleNavigateToDetail}
                        className="size-20 cursor-pointer rounded-full"
                    />
                ) : (
                    <SocialSourceIcon className="rounded-full" source={group.source} size={80} />
                )}

                <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-center gap-[6px] whitespace-nowrap">
                        <span
                            onClick={handleNavigateToDetail}
                            className="cursor-pointer overflow-auto truncate text-lg font-bold text-lightMain"
                        >
                            {group.name}
                        </span>
                        <SocialSourceIcon source={group.source} className="shrink-0" size={18} />
                    </div>
                    <div
                        onClick={handleNavigateToDetail}
                        className="flex cursor-pointer items-center gap-2 text-medium text-secondary"
                    >
                        <span className="min-w-0 truncate whitespace-nowrap">
                            <Trans>By @{ownerProfile?.handle || 'Unknown'}</Trans>
                        </span>
                        <div className="flex items-center gap-2">
                            <UserIcon width={18} height={18} />
                            <data value={followerCount} className="text-medium leading-6 text-lightMain">
                                {nFormatter(followerCount)}
                            </data>
                        </div>
                    </div>

                    <div className="flex min-h-5 gap-1">
                        {group.timestamp ? (
                            <Trans>
                                <span className="text-secondary">since </span>{' '}
                                <strong className="text-lightMain">
                                    {dayjs(group.timestamp).format('MMM DD, YYYY')}
                                </strong>
                            </Trans>
                        ) : null}
                    </div>
                </div>
            </div>

            <div onClick={handleNavigateToDetail}>
                <BioMarkup
                    className="mt-3 line-clamp-2 text-medium leading-[22px] text-lightMain"
                    source={group.source}
                >
                    {group.description ?? '-'}
                </BioMarkup>
            </div>
        </div>
    );
});
