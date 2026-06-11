'use client';

import { PredictionPlatform, ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import { memo, useCallback } from 'react';

import { BetItem } from '@/components/BetItem.js';
import { ListInPage } from '@/components/ListInPage.js';
import { PredictionPolymarketListItem } from '@/components/Prediction/PredictionPolymarketListItem.js';
import { formatPolymarketEventListData } from '@/helpers/formatPolymarketEventListData.js';
import { FIFA_EXCLUDE_TAG_ID } from '@/helpers/prediction/category/isFifaCategoryContext.js';
import {
    getCategoryPropsTagSlug,
    getPropsListSlugParams,
} from '@/helpers/prediction/category/parseCategoryRouteParams.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { shouldShowGamesPropsTabs } from '@/helpers/prediction/category/shouldShowGamesTab.js';
import { usePolymarketListSportsPrices } from '@/hooks/prediction/usePolymarketListSportsPrices.js';
import { getEventList } from '@/providers/firefly/prediction/getEventList.js';
import { GAMMA_EVENTS_PAGE_SIZE, getGammaEvents } from '@/providers/firefly/prediction/getGammaEvents.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

interface Props {
    context: CategorySlugContext;
}

function getBetsItemContent(_: number, data: PolymarketEventListData) {
    return (
        <div className="pb-3" key={data.id}>
            <BetItem
                event={formatPolymarketEventListData(data)}
                openLinkInNewTab={false}
                platform={PredictionPlatform.Polymarket}
            />
        </div>
    );
}

const SportsCategoryPropsListContent = memo<{ tagSlug: string }>(function SportsCategoryPropsListContent({ tagSlug }) {
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['prediction', 'category', 'gamma-events', tagSlug],
        queryFn: ({ pageParam }) =>
            getGammaEvents({
                tag_slug: tagSlug,
                offset: pageParam,
                exclude_tag_id: FIFA_EXCLUDE_TAG_ID,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.length < GAMMA_EVENTS_PAGE_SIZE) return undefined;
            return lastPageParam + GAMMA_EVENTS_PAGE_SIZE;
        },
        select: (data) =>
            uniqBy(
                data.pages.flatMap((page) => page),
                'id',
            ),
    });

    return (
        <div className="px-4 pb-8 pt-0">
            <ListInPage
                queryResult={queryResult}
                source={Source.Prediction}
                VirtualListProps={{
                    listKey: `${ScrollListKey.Prediction}:category:gamma:${tagSlug}`,
                    computeItemKey: (_, item) => item.id,
                    itemContent: getBetsItemContent,
                }}
                NoResultsFallbackProps={{
                    message: <Trans>No predictions found</Trans>,
                }}
            />
        </div>
    );
});

const SportsCategoryPropsList = memo<{ context: CategorySlugContext }>(function SportsCategoryPropsList({ context }) {
    const tagSlug = getCategoryPropsTagSlug(context);

    if (!tagSlug) {
        return (
            <p className="px-4 py-12 text-center text-sm text-second">
                <Trans>No predictions found</Trans>
            </p>
        );
    }

    return <SportsCategoryPropsListContent tagSlug={tagSlug} />;
});

const CategoryEventListPropsList = memo<{ context: CategorySlugContext }>(function CategoryEventListPropsList({
    context,
}) {
    const { slug, subSlug } = getPropsListSlugParams(context);

    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['prediction', 'category', 'props-list', slug, subSlug],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            return getEventList({ slug, subSlug, indicator });
        },
        initialPageParam: '',
        getNextPageParam: (lastPage) => {
            if (lastPage?.data.length === 0) return undefined;
            return lastPage?.nextIndicator?.id;
        },
        select: (data) =>
            uniqBy(
                data.pages.flatMap((page) => page?.data || []),
                'id',
            ),
    });

    const items = queryResult.data;
    const liveMarketPrices = usePolymarketListSportsPrices(items);

    const itemContent = useCallback(
        (_: number, data: PolymarketEventListData) => (
            <PredictionPolymarketListItem data={data} liveMarketPrices={liveMarketPrices} />
        ),
        [liveMarketPrices],
    );

    return (
        <div className="px-4 pb-8 pt-0">
            <ListInPage
                queryResult={queryResult}
                source={Source.Prediction}
                VirtualListProps={{
                    listKey: `${ScrollListKey.Prediction}:category:${slug}:${subSlug ?? ''}`,
                    computeItemKey: (_, item) => item.id,
                    itemContent,
                }}
                NoResultsFallbackProps={{
                    message: <Trans>No predictions found</Trans>,
                }}
            />
        </div>
    );
});

export const PredictionCategoryPropsList = memo<Props>(function PredictionCategoryPropsList({ context }) {
    if (shouldShowGamesPropsTabs(context)) {
        return <SportsCategoryPropsList context={context} />;
    }

    return <CategoryEventListPropsList context={context} />;
});
