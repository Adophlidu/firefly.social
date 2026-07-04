import type { Source } from '@dimensiondev/enums';
import { PredictionPlatform, SearchType } from '@dimensiondev/enums';
import { createIndicator, type PageIndicator } from '@dimensiondev/utils';
import { type InfiniteData, useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { resolveSearchUrlType, SearchUrlKind } from '@/helpers/resolveSearchUrlType.js';
import { logger } from '@/libs/Logger.js';
import { useLocale } from '@/hooks/useLocale.js';
import { getEventDetail } from '@/providers/firefly/prediction/getEventDetail.js';
import { type PredictionSearchTag, searchPrediction } from '@/providers/firefly/prediction/searchPrediction.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';
import type { SearchPredictionEventStatus } from '@/store/useSearchPredictionFilterStore.js';
import type { BetsEventDataForUI } from '@/types/prediction.js';

export type PredictionSearchItem = PolymarketEventListData | BetsEventDataForUI;

export type SearchPredictionContentPagedData = InfiniteData<
    {
        data: {
            events: PredictionSearchItem[];
            tags: PredictionSearchTag[];
        };
        nextIndicator: PageIndicator | undefined;
    },
    string
>;

export function useSearchPredictionContent<T>(
    searchKeyword: string,
    source: Source,
    eventsStatus: SearchPredictionEventStatus | undefined,
    selector: (data: SearchPredictionContentPagedData) => T,
) {
    const locale = useLocale();
    eventsStatus ??= 'active';
    return useSuspenseInfiniteQuery({
        queryKey: ['search', SearchType.Prediction, searchKeyword, source, eventsStatus, locale],
        queryFn: async ({ pageParam }) => {
            // Check if searchKeyword is a prediction URL and extract identifier if it matches
            const urlResult = resolveSearchUrlType(searchKeyword);
            const isPredictionUrl =
                urlResult?.kind === SearchUrlKind.Prediction && urlResult.platform && urlResult.identifier;

            // Use identifier if URL matches, otherwise use full searchKeyword
            const keyword = isPredictionUrl && urlResult.identifier ? urlResult.identifier : searchKeyword;
            if (!keyword.trim()) return { data: { events: [], tags: [] }, nextIndicator: undefined };

            const indicator = createIndicator(undefined, pageParam);
            const result = await searchPrediction({
                keyword,
                indicator,
                limit: 20,
                sort: 'volume_24hr',
                eventsStatus,
                searchTags: true,
                locale,
            });
            // Keep raw PolymarketEventListData so sports events can be detected and rendered like the trending page.
            const events: PredictionSearchItem[] = [...result.data];

            // Prepend pinned prediction on first page
            if (!pageParam && isPredictionUrl && urlResult.identifier && urlResult.platform) {
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

            return {
                data: { events, tags: result.tags },
                nextIndicator: result.nextIndicator,
            };
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.events.length === 0) return undefined;
            return lastPage?.nextIndicator?.id;
        },
        select: selector,
    });
}
