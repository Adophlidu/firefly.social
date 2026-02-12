import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import { BetItem } from '@/components/BetItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { PredictionPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { formatPolymarketEventListData } from '@/helpers/formatPolymarketEventListData.js';
import { createIndicator } from '@/helpers/pageable.js';
import { searchPrediction } from '@/providers/firefly/prediction/searchPrediction.js';
import { capturePolymarketSearchEventClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import { type PolymarketEventListData } from '@/providers/types/Firefly.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';

function getBetsItemContent(_: number, data: PolymarketEventListData) {
    return (
        <BetItem
            key={data.id}
            event={formatPolymarketEventListData(data)}
            openLinkInNewTab={false}
            platform={PredictionPlatform.Polymarket}
            onLinkClick={() => {
                capturePolymarketSearchEventClick(data.slug, data.title);
            }}
        />
    );
}

export function SearchPredictionContent() {
    const { searchKeyword, searchType, source } = useSearchStateStore();

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['search', searchType, searchKeyword, source],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            return searchPrediction({
                keyword: searchKeyword,
                indicator,
                limit: 20,
                sort: 'volume_24hr',
                eventsStatus: 'active',
                searchTags: true,
            });
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
                    message: <Trans>No predictions found</Trans>,
                }}
            />
        </div>
    );
}
