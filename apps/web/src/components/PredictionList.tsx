'use client';

import { ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import { useCallback } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { PredictionPolymarketListItem } from '@/components/Prediction/PredictionPolymarketListItem.js';
import { useSearchParams } from '@/esm/navigation.js';
import { usePolymarketListSportsPrices } from '@/hooks/prediction/usePolymarketListSportsPrices.js';
import { getEventList } from '@/providers/firefly/prediction/getEventList.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

interface Props {
    source: string;
}

export function PredictionList({ source }: Props) {
    const searchParams = useSearchParams();

    const subSlug = searchParams.get('subSlug') || undefined;
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['explore', 'bets', source, subSlug],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            return getEventList({ slug: source, indicator, subSlug });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return undefined;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) =>
            uniqBy(
                data.pages.flatMap((x) => x?.data || []),
                'id',
            ),
    });

    const items = queryResult.data;
    const liveMarketPrices = usePolymarketListSportsPrices(items);

    const itemContent = useCallback(
        (_: number, data: PolymarketEventListData) => (
            <PredictionPolymarketListItem
                data={data}
                liveMarketPrices={liveMarketPrices}
                sportsCellClassName="hover:!bg-bg"
            />
        ),
        [liveMarketPrices],
    );

    return (
        <div className="px-4 py-2">
            <ListInPage
                queryResult={queryResult}
                source={Source.Prediction}
                VirtualListProps={{
                    listKey: `${ScrollListKey.Prediction}:explore:${source}`,
                    computeItemKey: (_, item) => item.id,
                    itemContent,
                }}
                NoResultsFallbackProps={{
                    message: <Trans>No predictions found</Trans>,
                }}
            />
        </div>
    );
}
