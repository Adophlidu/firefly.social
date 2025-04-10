'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { compact } from 'lodash-es';

import { GroupInList } from '@/components/Group/GroupInList.js';
import { ListInPage } from '@/components/ListInPage.js';
import { Empty } from '@/components/Search/Empty.js';
import { ScrollListKey } from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { LensSocialMediaProvider } from '@/providers/lens/SocialMedia.js';
import type { ProfileGroup } from '@/providers/types/SocialMedia.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

function getGroupItemContent(group: ProfileGroup) {
    return <GroupInList group={group} key={group.id} />;
}

export function SearchGroupContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, source],
        queryFn: async ({ pageParam }) => {
            const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;

            return LensSocialMediaProvider.searchGroups(searchKeyword || '', indicator);
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return;
            return lastPage?.nextIndicator?.id;
        },
        select(data) {
            return compact(data.pages.flatMap((x) => x?.data ?? []));
        },
    });

    const listKey = `${ScrollListKey.Search}:${searchType}:${searchKeyword}:${source}`;

    return (
        <ListInPage
            source={source}
            key={listKey}
            queryResult={queryResult}
            VirtualListProps={{
                listKey,
                computeItemKey: (index, group) => `${group.id}_${index}`,
                itemContent: (_, group) => getGroupItemContent(group),
            }}
            NoResultsFallbackProps={{
                message: <Empty keyword={searchKeyword} />,
            }}
        />
    );
}
