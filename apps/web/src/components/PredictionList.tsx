'use client';

import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { BetItem } from '@/components/BetItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { PredictionPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { useSearchParams } from '@/esm/navigation.js';
import { formatPolymarketEventListData } from '@/helpers/formatPolymarketEventListData.js';
import { createIndicator } from '@/helpers/pageable.js';
import { getEventList } from '@/providers/firefly/prediction/getEventList.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

function getBetsItemContent(_: number, data: PolymarketEventListData) {
    return (
        <BetItem
            key={data.id}
            event={formatPolymarketEventListData(data)}
            openLinkInNewTab={false}
            platform={PredictionPlatform.Polymarket}
        />
    );
}

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
        select: (data) => data.pages.flatMap((x) => x?.data || []),
    });

    return (
        <div className="px-4 py-2">
            <ListInPage
                queryResult={queryResult}
                source={Source.Prediction}
                VirtualListProps={{
                    listKey: `${ScrollListKey.Prediction}:explore:${source}`,
                    computeItemKey: (index, item) => `${item.id}-${index}`,
                    itemContent: getBetsItemContent,
                }}
                NoResultsFallbackProps={{
                    message: <Trans>No bets found</Trans>,
                }}
            />
        </div>
    );
}
