import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { memo, useCallback, useMemo } from 'react';

import { DraftListItem } from '@/components/Compose/DraftList/DraftListItem.js';
import { NoResultsFallback } from '@/components/NoResultsFallback.js';
import { VirtualList } from '@/components/VirtualList/VirtualList.js';
import { VirtualListFooter } from '@/components/VirtualList/VirtualListFooter.js';
import { ScrollListKey } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { logger } from '@/libs/Logger.js';
import { getCloudDraftList } from '@/providers/firefly/cloud-draft/getCloudDraftList.js';
import { mergeDrafts } from '@/services/mergeDrafts.js';
import { type Draft, useComposeDraftState } from '@/store/useComposeDraftStore.js';
import { useFireflyProfileStore } from '@/store/useProfileStore/useFireflyProfileStore.js';

function getDraftListItemContent(draft: Draft) {
    return <DraftListItem draft={draft} key={`${draft.draftType}-${draft.draftId}`} />;
}

export const DraftList = memo(function DraftList() {
    const { currentProfileSession } = useFireflyProfileStore();
    const { drafts } = useComposeDraftState();

    const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } = useSuspenseInfiniteQuery({
        queryKey: ['cloud-drafts', currentProfileSession?.profileId],
        staleTime: 1000 * 60, // 1 minute
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            if (!currentProfileSession?.profileId) return createPageable([], indicator);

            try {
                return await getCloudDraftList({ indicator });
            } catch (error) {
                logger.error('Failed to fetch cloud drafts', error);
                return createPageable([], indicator);
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        refetchOnMount: true,
        select: (data) => data.pages,
    });

    const mergedDrafts = useMemo(() => mergeDrafts(drafts, data), [drafts, data]);

    const onEndReached = useCallback(async () => {
        if (!hasNextPage || isFetching || isFetchingNextPage) {
            return;
        }
        await fetchNextPage();
    }, [hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

    if (!mergedDrafts.length) {
        return (
            <div className="flex min-h-[478px] flex-col justify-center">
                <NoResultsFallback className="h-full" />
            </div>
        );
    }

    return (
        <div className="no-scrollbar h-[478px] overflow-auto px-6">
            <VirtualList
                data={mergedDrafts}
                endReached={onEndReached}
                components={{
                    Footer: VirtualListFooter,
                }}
                className="no-scrollbar schedule-task-list box-border h-full min-h-0 flex-1"
                listKey={ScrollListKey.DraftList}
                computeItemKey={(index, item) => `${item.draftType}-${item.draftId}`}
                itemContent={(index, item) => getDraftListItemContent(item)}
            />
        </div>
    );
});
