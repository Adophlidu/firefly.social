'use client';

import { ScrollListKey, Source } from '@dimensiondev/enums';
import { createIndicator } from '@dimensiondev/utils';
import { Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { uniqBy } from 'lodash-es';
import { memo, useEffect } from 'react';

import { ListInPage } from '@/components/ListInPage.js';
import { PredictionPolymarketListItem } from '@/components/Prediction/PredictionPolymarketListItem.js';
import { CRYPTO_PRIMARY_SLUG } from '@/helpers/prediction/category/constants.js';
import {
    CRYPTO_ALL_SLUG,
    CRYPTO_DEFAULT_PERIOD_SLUG,
    CRYPTO_ETF_TAG_ID,
    CRYPTO_QUICK_BUY_SLUG,
    getCryptoPeriod,
    getCryptoSecondaryCategory,
} from '@/helpers/prediction/category/cryptoCategoryConfig.js';
import { filterAndSortCryptoQuickBuyEvents } from '@/helpers/prediction/category/filterCryptoQuickBuyEvents.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { useLocale } from '@/hooks/useLocale.js';
import { getEventList } from '@/providers/firefly/prediction/getEventList.js';
import { GAMMA_EVENTS_PAGE_SIZE, getGammaEvents } from '@/providers/firefly/prediction/getGammaEvents.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

interface Props {
    context: CategorySlugContext;
}

/** Crypto events are not sports markets — pass a stable empty price map to the shared cell. */
const EMPTY_LIVE_PRICES: Record<string, string> = {};

type GammaTransform = (events: PolymarketEventListData[]) => PolymarketEventListData[];

function getItemContent(_: number, data: PolymarketEventListData) {
    return (
        <div className="pb-3" key={data.id}>
            <PredictionPolymarketListItem data={data} liveMarketPrices={EMPTY_LIVE_PRICES} />
        </div>
    );
}

function NoPredictions() {
    return (
        <p className="px-4 py-12 text-center text-sm text-second">
            <Trans>No predictions found</Trans>
        </p>
    );
}

/**
 * 24hr-volume-ordered gamma events for a Crypto tab (matches Polymarket's default `volume24hr`
 * sort). Period/topic tabs intersect their tag with the `crypto` tag server-side (`tagIds` +
 * `tag_match=all`, e.g. crypto ∩ monthly); Quick Buy fetches a period tag (`tagSlug`) and passes a
 * `transform` that filters to BTC/ETH/SOL and coin-sorts. All fetches are active-only.
 */
const CryptoGammaEventsList = memo<{
    /** Single period tag (Quick Buy). Mutually exclusive with {@link tagIds}. */
    tagSlug?: string;
    /** Tag IDs to fetch (`tag_id=…` repeated). */
    tagIds?: number[];
    /** How to combine {@link tagIds}: `'all'` (AND) for crypto∩tag, `'any'` (OR) for topic unions. */
    tagMatch?: 'all' | 'any';
    /** Drop events whose endDate passed (zombie recurring markets) via `end_date_min=now`. */
    liveOnly?: boolean;
    /** Tag IDs to exclude (`exclude_tag_id`) — Pre-Market excludes `ipos`. */
    excludeTagIds?: number[];
    transform?: GammaTransform;
    listKeySuffix: string;
}>(function CryptoGammaEventsList({
    tagSlug,
    tagIds,
    tagMatch = 'all',
    liveOnly,
    excludeTagIds,
    transform,
    listKeySuffix,
}) {
    const locale = useLocale();
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['prediction', 'category', 'crypto', 'gamma', listKeySuffix, tagIds ?? tagSlug ?? null, locale],
        queryFn: ({ pageParam }) =>
            getGammaEvents(
                tagIds
                    ? {
                          tag_id: tagIds,
                          tag_match: tagMatch,
                          offset: pageParam,
                          order: 'volume24hr',
                          locale,
                          ...(liveOnly ? { end_date_min: new Date().toISOString() } : {}),
                          ...(excludeTagIds?.length ? { exclude_tag_id: excludeTagIds } : {}),
                      }
                    : {
                          tag_slug: tagSlug!,
                          offset: pageParam,
                          order: 'volume24hr',
                          locale,
                          ...(excludeTagIds?.length ? { exclude_tag_id: excludeTagIds } : {}),
                      },
            ),
        initialPageParam: 0,
        getNextPageParam: (lastPage, _allPages, lastPageParam) => {
            if (lastPage.length < GAMMA_EVENTS_PAGE_SIZE) return undefined;
            return lastPageParam + GAMMA_EVENTS_PAGE_SIZE;
        },
        select: (data) => {
            const flattened = uniqBy(
                data.pages.flatMap((page) => page),
                'id',
            );
            return transform ? transform(flattened) : flattened;
        },
    });

    // Quick Buy filters to BTC/ETH/SOL in `select`, so a raw gamma page can yield zero kept items
    // even when more pages exist (the page was full of other coins). An empty first page would
    // otherwise trap the list on "No predictions found" — `ListInPage` short-circuits to the
    // fallback before its virtual list mounts, so `endReached` never fires. Keep paging until items
    // appear or the raw pages are exhausted (then the genuine empty fallback shows).
    const { data, hasNextPage, isFetching, fetchNextPage } = queryResult;
    useEffect(() => {
        if (transform && data.length === 0 && hasNextPage && !isFetching) {
            void fetchNextPage();
        }
    }, [transform, data.length, hasNextPage, isFetching, fetchNextPage]);

    return (
        <div className="px-4 pb-8 pt-0">
            <ListInPage
                queryResult={queryResult}
                source={Source.Prediction}
                VirtualListProps={{
                    listKey: `${ScrollListKey.Prediction}:category:crypto:gamma:${listKeySuffix}`,
                    computeItemKey: (_, item) => item.id,
                    itemContent: getItemContent,
                }}
                NoResultsFallbackProps={{
                    message: <Trans>No predictions found</Trans>,
                }}
            />
        </div>
    );
});

/** "All Crypto" — the `crypto` event-list endpoint (volume-ordered). Client-fetched (no SSR prefetch). */
const CryptoAllEventsList = memo(function CryptoAllEventsList() {
    const locale = useLocale();
    const queryResult = useSuspenseInfiniteQuery({
        queryKey: ['prediction', 'category', 'crypto', CRYPTO_ALL_SLUG, locale],
        queryFn: async ({ pageParam }) => {
            const indicator = createIndicator(undefined, pageParam);
            return getEventList({ slug: CRYPTO_PRIMARY_SLUG, indicator, locale });
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

    return (
        <div className="px-4 pb-8 pt-0">
            <ListInPage
                queryResult={queryResult}
                source={Source.Prediction}
                VirtualListProps={{
                    listKey: `${ScrollListKey.Prediction}:category:crypto:${CRYPTO_ALL_SLUG}`,
                    computeItemKey: (_, item) => item.id,
                    itemContent: getItemContent,
                }}
                NoResultsFallbackProps={{
                    message: <Trans>No predictions found</Trans>,
                }}
            />
        </div>
    );
});

/**
 * Branches on the active Crypto secondary:
 * - `quick-buy` → period tag, filtered to BTC/ETH/SOL and coin-priority sorted.
 * - `all` → the `crypto` event-list (volume-ordered).
 * - others (weekly/monthly/…) → crypto ∩ their tag (server-side intersection), volume-ordered.
 * Each item renders with the existing `PredictionPolymarketListItem` (no cell changes this PR).
 */
export const PredictionCategoryCryptoPropsList = memo<Props>(function PredictionCategoryCryptoPropsList({ context }) {
    const secondarySlug = context.secondaryItem?.slug ?? context.activeItem.slug;

    if (secondarySlug === CRYPTO_QUICK_BUY_SLUG) {
        const periodSlug = context.depth === 3 ? context.activeItem.slug : CRYPTO_DEFAULT_PERIOD_SLUG;
        const period = getCryptoPeriod(periodSlug);
        if (!period) return <NoPredictions />;
        return (
            <CryptoGammaEventsList
                tagSlug={period.tagSlug}
                excludeTagIds={[CRYPTO_ETF_TAG_ID]}
                transform={filterAndSortCryptoQuickBuyEvents}
                listKeySuffix={`${CRYPTO_QUICK_BUY_SLUG}:${periodSlug}`}
            />
        );
    }

    if (secondarySlug === CRYPTO_ALL_SLUG) {
        return <CryptoAllEventsList />;
    }

    const config = getCryptoSecondaryCategory(secondarySlug);
    if (!config?.tagIds?.length) return <NoPredictions />;

    // Server-side crypto filter: period/feature tabs AND crypto with their tag (`tag_match=all`);
    // Protocol Metrics ORs crypto-inherent metric tags (`tag_match=any`). So a cross-asset tag no
    // longer leaks stocks/commodities (Silver, NVDA, …) into the crypto tabs.
    return (
        <CryptoGammaEventsList
            tagIds={config.tagIds}
            tagMatch={config.tagMatch}
            liveOnly={config.liveOnly}
            excludeTagIds={config.excludeTagIds}
            listKeySuffix={secondarySlug}
        />
    );
});
