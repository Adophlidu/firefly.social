'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { BetsActivityItem } from '@/components/Bets/BetsActivityItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { ScrollListKey, Source } from '@/constants/enum.js';
import { createIndicator, createPageable } from '@/helpers/pageable.js';
import { getDiscoverBetsList } from '@/providers/firefly/bets/getDiscoverBetsList.js';
import type { BetsActivity } from '@/providers/types/Firefly.js';
import { BetsFilterNamespace, useBetsSourceFilterStore } from '@/store/useBetsSourceFilterStore.js';

function getBetsActivityItem(index: number, activity: BetsActivity, onClick?: () => void) {
    return <BetsActivityItem activity={activity} key={`${activity.slug}-${index}`} onLinkClick={onClick} />;
}

export function DiscoverBetsTimeline() {
    const { platforms } = useBetsSourceFilterStore(BetsFilterNamespace.Discover);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['bets', 'list', 'discover', platforms.join(',')],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            try {
                return await getDiscoverBetsList({
                    indicator,
                    platform: platforms,
                });
            } catch {
                return createPageable([], indicator);
            }
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage.nextIndicator?.id,
        select: (data) => data.pages.flatMap((x) => x.data),
    });

    return (
        <ListInPage
            source={Source.Bets}
            key={Source.Bets}
            queryResult={queryResult}
            VirtualListProps={{
                useWindowScroll: true,
                listKey: `${ScrollListKey.Bets}:discover`,
                computeItemKey: (index, activity) => `${activity.slug}-${index}`,
                itemContent: (index, activity) => getBetsActivityItem(index, activity),
            }}
            NoResultsFallbackProps={{
                className: 'mt-20',
            }}
        />
    );
}
