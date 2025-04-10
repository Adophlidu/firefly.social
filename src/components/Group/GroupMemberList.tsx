'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { ProfileInList } from '@/components/ProfileInList.js';
import { ScrollListKey } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { Profile, ProfileGroup } from '@/providers/types/SocialMedia.js';

interface GroupMemberListProps {
    group: ProfileGroup;
}

function getGroupInList(index: number, profile: Profile) {
    return <ProfileInList profile={profile} key={`${profile.profileId}-${index}`} />;
}

export const GroupMemberList = memo(function GroupMemberList({ group }: GroupMemberListProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['profiles', group.source, 'group', group.id],
        async queryFn({ pageParam }) {
            return LensSocialMediaProvider.getGroupMembers(group.id, createIndicator(undefined, pageParam));
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => data.pages.flatMap((page) => page?.data ?? []),
    });

    return (
        <ListInPage
            source={group.source}
            key={group.source}
            queryResult={queryResult}
            VirtualListProps={{
                key: `${ScrollListKey.GroupMembers}:${group.source}:${group.id}`,
                computeItemKey: (index, item) => `${item.profileId}-${index}`,
                itemContent: (index, item) => getGroupInList(index, item),
            }}
            NoResultsFallbackProps={{
                className: 'md:pt-[228px] max-md:py-20',
            }}
        />
    );
});
