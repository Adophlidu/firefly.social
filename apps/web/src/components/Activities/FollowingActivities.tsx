'use client';

import { ScrollListKey, Source } from '@dimensiondev/enums';
import { useMultiInfiniteQueryPageable } from '@dimensiondev/hooks';
import { createIndicator, createPageable } from '@dimensiondev/utils';

import { getFollowingActivities } from '@/components/Activities/getActivities.js';
import { getActivitiesItemContent } from '@/components/Activities/getActivitiesItemContent.js';
import { ListInPage } from '@/components/ListInPage.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { useAsyncStatusAll } from '@/hooks/useAsyncStatus.js';
import { useCurrentProfileIds } from '@/hooks/useCurrentProfile.js';
import { useIsLoginFirefly } from '@/hooks/useIsLoginFirefly.js';
import { ActivitiesFilterNamespace, useActivitiesFilterStore } from '@/store/useActivitiesFilterStore.js';

export function FollowingActivities() {
    const isLogin = useIsLoginFirefly();
    const profileIds = useCurrentProfileIds();
    const asyncStatusAll = useAsyncStatusAll();
    const { selectedPlatforms } = useActivitiesFilterStore(ActivitiesFilterNamespace.Home);

    const queryResult = useMultiInfiniteQueryPageable(
        ['activities', 'following', asyncStatusAll, selectedPlatforms, profileIds],
        ([Source.Article, Source.DAOs] as const).map((source) => ({
            key: source,
            async queryFn({ pageParam }) {
                if (!isLogin) return createPageable([], createIndicator(undefined, pageParam));

                const result = await getFollowingActivities(source, selectedPlatforms, pageParam);

                return result;
            },
        })),
        (data) => {
            return data.pages.flatMap((page) =>
                page.data.concat().sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)),
            );
        },
    );

    if (!profileIds.length) {
        return <NotLoginFallback source={Source.DAOs} />;
    }

    return (
        <ListInPage
            source={Source.Wallet}
            queryResult={queryResult}
            VirtualListProps={{
                listKey: `${ScrollListKey.Activities}:following`,
                computeItemKey: (index, item) => `${item.id}-${index}`,
                itemContent: (index, item) =>
                    getActivitiesItemContent(index, item, `${ScrollListKey.Activities}:following`),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
