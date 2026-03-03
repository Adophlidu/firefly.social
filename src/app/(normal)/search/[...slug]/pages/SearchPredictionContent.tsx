import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';

import { BetItem } from '@/components/BetItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { PredictionPlatform, ScrollListKey, Source } from '@/constants/enum.js';
import { formatPolymarketEventListData } from '@/helpers/formatPolymarketEventListData.js';
import { createIndicator } from '@/helpers/pageable.js';
import { resolveSearchUrlType, SearchUrlKind } from '@/helpers/resolveSearchUrlType.js';
import { logger } from '@/libs/Logger.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { searchPrediction } from '@/providers/firefly/prediction/searchPrediction.js';
import { capturePolymarketSearchEventClick } from '@/providers/telemetry/capturePolymarketEvent.js';
import { useSearchStateStore } from '@/store/useSearchStore.js';
import { type BetsEventDataForUI } from '@/types/prediction.js';

function getBetsItemContent(_: number, data: BetsEventDataForUI) {
    return (
        <BetItem
            key={data.id}
            event={data}
            openLinkInNewTab={false}
            platform={data.platform}
            onLinkClick={() => {
                capturePolymarketSearchEventClick(data.slug ?? '', data.title);
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
            const result = await searchPrediction({
                keyword: searchKeyword,
                indicator,
                limit: 20,
                sort: 'volume_24hr',
                eventsStatus: 'active',
                searchTags: true,
            });

            const events = result.data.map(formatPolymarketEventListData);

            // Prepend pinned prediction on first page
            if (!pageParam) {
                const urlResult = resolveSearchUrlType(searchKeyword);
                if (urlResult?.kind === SearchUrlKind.Prediction && urlResult.platform && urlResult.identifier) {
                    try {
                        const isMutil =
                            urlResult.platform === PredictionPlatform.Opinion ? Boolean(urlResult.isMultiple) : false;
                        const event = await getEventDetail(urlResult.platform, {
                            id: urlResult.identifier,
                            isMutil,
                        });
                        if (event) events.unshift(event);
                    } catch (error) {
                        logger.error('[Search] Failed to fetch pinned prediction', error);
                    }
                }
            }

            return {
                data: events,
                nextIndicator: result.nextIndicator,
            };
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return undefined;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) =>
            uniqBy(
                data.pages.flatMap((x) => x?.data || []),
                (e) => e.id,
            ),
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
