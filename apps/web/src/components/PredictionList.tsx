'use client';

import { Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';

import { BetItem } from '@/components/BetItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { PredictionPlatform, ScrollListKey } from '@/constants/enum.js';
import { useSearchParams } from '@/esm/navigation.js';
import { formatPolymarketEventListData } from '@/helpers/formatPolymarketEventListData.js';
import { getEventList } from '@/providers/firefly/prediction/getEventList.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

function getBetsItemContent(_: number, data: PolymarketEventListData) {
    return (
        <div className="pb-4" key={data.id}>
            <BetItem
                event={formatPolymarketEventListData(data)}
                openLinkInNewTab={false}
                platform={PredictionPlatform.Polymarket}
            />
        </div>
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
        select: (data) =>
            uniqBy(
                data.pages.flatMap((x) => x?.data || []),
                'id',
            ),
    });

    return (
        <div className="px-4 py-2">
            <ListInPage
                queryResult={queryResult}
                source={Source.Prediction}
                VirtualListProps={{
                    listKey: `${ScrollListKey.Prediction}:explore:${source}`,
                    computeItemKey: (_, item) => item.id,
                    itemContent: getBetsItemContent,
                }}
                NoResultsFallbackProps={{
                    message: <Trans>No bets found</Trans>,
                }}
            />
        </div>
    );
}
