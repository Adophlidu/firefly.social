'use client';

import { ScrollListKey, Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { uniqBy } from 'lodash-es';
import { useCallback } from 'react';

import {
    type PredictionSearchItem,
    type SearchPredictionContentPagedData,
    useSearchPredictionContent,
} from '@/app/[locale]/(normal)/search/[...slug]/pages/useSearchPredictionContent.js';
import { BetItem } from '@/components/BetItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { PredictionPolymarketListItem } from '@/components/Prediction/PredictionPolymarketListItem.js';
import { SearchPredictionEventStatusTabs } from '@/components/Search/SearchPredictionEventStatusTabs.js';
import { usePolymarketListSportsPrices } from '@/hooks/prediction/usePolymarketListSportsPrices.js';
import { capturePolymarketSearchEventClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';
import { useSearchPredictionEventStatus } from '@/store/useSearchPredictionFilterStore.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

// Raw PolymarketEventListData has no `platform`; formatted BetsEventDataForUI does.
const isBetsEventDataForUI = (x: PredictionSearchItem): x is BetsEventDataForUI => 'platform' in x;

function selector(data: SearchPredictionContentPagedData) {
    const events = uniqBy(
        data.pages.flatMap((x) => x?.data?.events || []),
        (e) => e.id,
    );
    return events;
}

export function SearchPredictionContent() {
    const { searchKeyword, source } = useSearchStateStore();
    const [eventStatus] = useSearchPredictionEventStatus();
    const queryResult = useSearchPredictionContent(searchKeyword, source, eventStatus, selector);

    const items = queryResult.data;
    const liveMarketPrices = usePolymarketListSportsPrices(
        items.filter((x): x is PolymarketEventListData => !isBetsEventDataForUI(x)),
    );

    const itemContent = useCallback(
        (_: number, data: PredictionSearchItem) => {
            if (isBetsEventDataForUI(data)) {
                // Pinned prediction detail (search keyword was a prediction URL).
                return (
                    <BetItem
                        key={data.id}
                        event={data}
                        openLinkInNewTab={false}
                        platform={data.platform}
                        className="mb-4"
                        onLinkClick={() => {
                            capturePolymarketSearchEventClick(data.slug ?? '', data.title);
                        }}
                    />
                );
            }
            // Raw search result — render through the same component the trending page uses.
            return (
                <PredictionPolymarketListItem
                    key={data.id}
                    data={data}
                    liveMarketPrices={liveMarketPrices}
                    sportsCellClassName="hover:!bg-bg"
                    onLinkClick={() => capturePolymarketSearchEventClick(data.slug ?? '', data.title)}
                />
            );
        },
        [liveMarketPrices],
    );

    return (
        <>
            <SearchPredictionEventStatusTabs className="lg:hidden" />
            <div className="p-4">
                <ListInPage
                    queryResult={queryResult}
                    source={Source.Prediction}
                    VirtualListProps={{
                        listKey: `${ScrollListKey.Prediction}:explore:${source}`,
                        computeItemKey: (index, item) => `${item.id}-${index}`,
                        itemContent,
                    }}
                    NoResultsFallbackProps={{
                        message: <Trans>No predictions found</Trans>,
                    }}
                />
            </div>
        </>
    );
}
