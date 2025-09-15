'use client';

import { getForYouActivities } from '@/components/Activities/getActivities.js';
import { getActivitiesItemContent } from '@/components/Activities/getActivitiesItemContent.js';
import { ListInPage } from '@/components/ListInPage.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { useMultiInfiniteQueryPageable } from '@/hooks/useMultiInfiniteQueryPageable.js';
import { ActivitiesFilterNamespace, useActivitiesFilterStore } from '@/store/useActivitiesFilterStore.js';

export function ForYouActivities() {
    const { selectedPlatform } = useActivitiesFilterStore(ActivitiesFilterNamespace.Home);

    const queryResult = useMultiInfiniteQueryPageable(
        ['activities', 'discover', selectedPlatform],
        ([Source.Article, Source.DAOs] as const).map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                const result = await getForYouActivities(source, pageParam, selectedPlatform || undefined);

                return result;
            },
        })),
        (data) => {
            return data.pages.flatMap((page) =>
                page.data.concat().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
            );
        },
    );

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Activities}:for-you`,
                computeItemKey: (index, item) => `${item.id}-${index}`,
                itemContent: (index, item) =>
                    getActivitiesItemContent(index, item, `${ScrollListKey.Activities}:for-you`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
