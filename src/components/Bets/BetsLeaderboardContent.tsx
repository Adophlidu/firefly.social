'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { BetsLeaderboardItem } from '@/components/Bets/BetsLeaderboardItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import {
    BetsLeaderboardTab,
    type PolymarketRankOrder,
    type PolymarketRankPeriod,
    ScrollListKey,
    Source,
} from '@/constants/enum.js';
import { createIndicator } from '@/helpers/pageable.js';
import { getPolymarketRank, type PolymarketRankItem } from '@/providers/firefly/bets/getPolymarketRank.js';

function getBetsLeaderboardItem(index: number, tab: BetsLeaderboardTab, item: PolymarketRankItem) {
    const itemRank = item.rank ?? index + 1;
    return <BetsLeaderboardItem item={item} rank={itemRank} showPnLRate={tab === BetsLeaderboardTab.Following} />;
}

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
                itemContent: (index, item) => getBetsLeaderboardItem(index, tab, item),
            }}
        />
    );
}
