'use client';

import { ScrollListKey, Source } from '@dimensiondev/enums';
import { Trans } from '@lingui/react/macro';
import { uniqBy } from 'lodash-es';

import {
    type SearchPredictionContentPagedData,
    useSearchPredictionContent,
} from '@/app/[locale]/(normal)/search/[...slug]/pages/useSearchPredictionContent.js';
import { BetItem } from '@/components/BetItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { SearchPredictionEventStatusTabs } from '@/components/Search/SearchPredictionEventStatusTabs.js';
import { capturePolymarketSearchEventClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import { useSearchPredictionEventStatus } from '@/store/useSearchPredictionFilterStore.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

function getBetsItemContent(_: number, data: BetsEventDataForUI) {
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
                        itemContent: getBetsItemContent,
                    }}
                    NoResultsFallbackProps={{
                        message: <Trans>No predictions found</Trans>,
                    }}
                />
            </div>
        </>
    );
}
