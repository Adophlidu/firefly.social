'use client';

import { Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { ListInPage } from '@/components/ListInPage.js';
import { PredictionLeaderboardItem } from '@/components/Prediction/PredictionLeaderboardItem.js';
import {
    BetsLeaderboardTab,
    type PolymarketRankOrder,
    type PolymarketRankPeriod,
    ScrollListKey,
} from '@/constants/enum.js';
import { getPolymarketRank, type PolymarketRankItem } from '@/providers/firefly/prediction/getPolymarketRank.js';

function getPredictionLeaderboardItem(index: number, tab: BetsLeaderboardTab, item: PolymarketRankItem) {
    const itemRank = item.rank ?? index + 1;
    return <PredictionLeaderboardItem item={item} rank={itemRank} showPnLRate={tab === BetsLeaderboardTab.Following} />;
}

interface PredictionLeaderboardContentProps {
    tab: BetsLeaderboardTab;
    period: PolymarketRankPeriod;
    order: PolymarketRankOrder;
}

export function PredictionLeaderboardContent({ tab, period, order }: PredictionLeaderboardContentProps) {
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
            source={Source.Prediction}
            VirtualListProps={{
                listKey: `${ScrollListKey.BetsLeaderboard}:${tab}:${period}:${order}`,
                computeItemKey: (index, item) => `${item.owner || item.wallet}-${index}`,
                itemContent: (index, item) => getPredictionLeaderboardItem(index, tab, item),
            }}
        />
    );
}
