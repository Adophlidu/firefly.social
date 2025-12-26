'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { BetsLeaderboardItem } from '@/components/Bets/BetsLeaderboardItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import {
    BetsLeaderboardTab,
    PolymarketRankOrder,
    PolymarketRankPeriod,
    ScrollListKey,
    Source,
} from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { getPolymarketRank } from '@/providers/firefly/bets/getPolymarketRank.js';

interface BetsLeaderboardContentProps {
    tab: BetsLeaderboardTab;
    period: PolymarketRankPeriod;
    order: PolymarketRankOrder;
}

export function BetsLeaderboardContent({ tab, period, order }: BetsLeaderboardContentProps) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['polymarket-rank', tab, period, order],
        queryFn: async ({ pageParam }) => {
            return getPolymarketRank(
                {
                    is_following: tab === BetsLeaderboardTab.Following,
                    period,
                    order,
                    limit: 50,
                },
                createIndicator(undefined, pageParam as string),
            );
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => lastPage?.nextIndicator?.id,
        select: (data) => data.pages.flatMap((page) => page.data ?? []),
    });

    return (
        <ListInPage
            queryResult={queryResult}
            source={Source.Bets}
            VirtualListProps={{
                listKey: `${ScrollListKey.BetsLeaderboard}:${tab}:${period}:${order}`,
                computeItemKey: (index, item) => `${item.owner || item.wallet}-${index}`,
                itemContent: (index, item) => {
                    const itemRank = item.rank ?? index + 1;
                    return (
                        <BetsLeaderboardItem
                            item={item}
                            rank={itemRank}
                            showPnLRate={tab === BetsLeaderboardTab.Following}
                        />
                    );
                },
            }}
        />
    );
}
