'use client';

import { classNames } from '@dimensiondev/utils';
import { useQuery } from '@tanstack/react-query';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { Suspense, useCallback, useEffect, useMemo } from 'react';

import { ErrorBoundary } from '@/components/ErrorBoundary/index.js';
import { FootballLoading } from '@/components/FootballLoading.js';
import { Loading } from '@/components/Loading.js';
import { NotFound } from '@/components/NotFound.js';
import { PredictionCategoryBracketList } from '@/components/Prediction/Category/PredictionCategoryBracketList.js';
import { PredictionCategoryCryptoPeriodSwitcher } from '@/components/Prediction/Category/PredictionCategoryCryptoPeriodSwitcher.js';
import { PredictionCategoryCryptoPropsList } from '@/components/Prediction/Category/PredictionCategoryCryptoPropsList.js';
import { PredictionCategoryCryptoSecondaryNav } from '@/components/Prediction/Category/PredictionCategoryCryptoSecondaryNav.js';
import { PredictionCategoryGamesList } from '@/components/Prediction/Category/PredictionCategoryGamesList.js';
import { PredictionCategoryGroupsList } from '@/components/Prediction/Category/PredictionCategoryGroupsList.js';
import { PredictionCategoryHeader } from '@/components/Prediction/Category/PredictionCategoryHeader.js';
import { PredictionCategoryPrimaryTabs } from '@/components/Prediction/Category/PredictionCategoryPrimaryTabs.js';
import { PredictionCategoryPropsList } from '@/components/Prediction/Category/PredictionCategoryPropsList.js';
import { PredictionCategorySecondaryNav } from '@/components/Prediction/Category/PredictionCategorySecondaryNav.js';
import { PredictionCategoryToolbar } from '@/components/Prediction/Category/PredictionCategoryToolbar.js';
import { FIFA_SLUG } from '@/constants/bets.js';
import { STALE_TIMES } from '@/constants/query.js';
import { useRouter } from '@/esm/navigation.js';
import type { PredictionCategoryPropsInitialData } from '@/helpers/buildPredictionCategoryPropsInitialData.js';
import { buildPredictionCategoryHref } from '@/helpers/prediction/category/buildPredictionCategoryHref.js';
import {
    CRYPTO_PRIMARY_SLUG,
    PREDICTION_CATEGORY_BRACKET_TAB,
    PREDICTION_CATEGORY_GAMES_TAB,
    PREDICTION_CATEGORY_GROUPS_TAB,
    PREDICTION_CATEGORY_PROPS_TAB,
    type PredictionCategoryTab,
} from '@/helpers/prediction/category/constants.js';
import {
    CRYPTO_QUICK_BUY_SLUG,
    getCryptoDefaultPeriodItem,
    resolveCryptoCategoryTitle,
} from '@/helpers/prediction/category/cryptoCategoryConfig.js';
import { enrichSlugListWithCryptoTree } from '@/helpers/prediction/category/enrichSlugListWithCryptoTree.js';
import { getCategoryHeaderLabel } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { getDefaultSecondaryCategoryItem } from '@/helpers/prediction/category/getDefaultSecondaryCategoryItem.js';
import { isSportsLiveCategoryContext } from '@/helpers/prediction/category/isSportsLiveCategoryContext.js';
import {
    type CategorySlugContext,
    resolveCategorySlugContext,
} from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { resolvePredictionCategoryLabel } from '@/helpers/prediction/category/resolvePredictionCategoryLabel.js';
import { shouldShowGamesPropsTabs, shouldShowGamesTab } from '@/helpers/prediction/category/shouldShowGamesTab.js';
import { useCategoryGamesPropsAvailability } from '@/hooks/prediction/useCategoryGamesPropsAvailability.js';
import { useLocale } from '@/hooks/useLocale.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    slugs: string[];
    slugList: PolymarketEventSlugListData[];
    initialPropsListPage?: PredictionCategoryPropsInitialData;
}

function PredictionCategoryStickyNav({
    slugs,
    context,
}: {
    slugs?: PolymarketEventSlugListData[];
    context?: CategorySlugContext;
}) {
    const isCryptoPrimary = context?.primaryItem.slug === CRYPTO_PRIMARY_SLUG;
    return (
        <div className="sticky top-0 z-30 bg-primaryBottom">
            <PredictionCategoryToolbar />
            {slugs && context ? (
                <div className="flex flex-col gap-3">
                    <PredictionCategoryPrimaryTabs slugs={slugs} context={context} />
                    {isCryptoPrimary ? (
                        <PredictionCategoryCryptoSecondaryNav context={context} />
                    ) : (
                        <PredictionCategorySecondaryNav slugs={slugs} context={context} />
                    )}
                </div>
            ) : null}
        </div>
    );
}

export function PredictionCategoryPage({ slugs, slugList: initialSlugList, initialPropsListPage }: Props) {
    const router = useRouter();
    const locale = useLocale();
    const { data: slugList = initialSlugList } = useQuery({
        queryKey: ['prediction', 'category', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: STALE_TIMES.INFINITY,
        select: (data) => data?.filter((x) => x.slug !== FIFA_SLUG),
        initialData: initialSlugList,
    });

    const context = useMemo(() => {
        if (!slugList) return null;
        // Graft the frontend-defined Crypto tab tree so crypto/quick-buy/1h etc. resolve.
        return resolveCategorySlugContext(enrichSlugListWithCryptoTree(slugList), slugs);
    }, [slugList, slugs]);

    const shouldRedirectToDefaultSecondary = useMemo(() => {
        if (context?.depth !== 1) return false;
        return !!getDefaultSecondaryCategoryItem(context.primaryItem);
    }, [context]);

    // Crypto Quick Buy lives one level deeper than its secondary — send /crypto/quick-buy to the
    // default period (/crypto/quick-buy/1h). Crypto-only; no generic depth-3 redirect.
    const shouldRedirectToDefaultPeriod = useMemo(() => {
        return (
            !!context &&
            context.primaryItem.slug === CRYPTO_PRIMARY_SLUG &&
            context.secondaryItem?.slug === CRYPTO_QUICK_BUY_SLUG &&
            context.depth === 2
        );
    }, [context]);

    useEffect(() => {
        if (!shouldRedirectToDefaultSecondary || !context) return;

        const defaultSecondary = getDefaultSecondaryCategoryItem(context.primaryItem);
        if (!defaultSecondary) return;

        router.replace(buildPredictionCategoryHref(defaultSecondary, [context.primaryItem]));
    }, [context, router, shouldRedirectToDefaultSecondary]);

    useEffect(() => {
        if (!shouldRedirectToDefaultPeriod || !context) return;

        const quickBuy = context.secondaryItem;
        if (!quickBuy) return;

        router.replace(buildPredictionCategoryHref(getCryptoDefaultPeriodItem(), [context.primaryItem, quickBuy]));
    }, [context, router, shouldRedirectToDefaultPeriod]);

    const showGamesList = shouldShowGamesTab(context?.activeItem);
    const isLiveGamesOnly = context ? isSportsLiveCategoryContext(context) : false;

    const [tab, setTab] = useQueryState(
        'tab',
        parseAsStringEnum<PredictionCategoryTab>([
            PREDICTION_CATEGORY_GAMES_TAB,
            PREDICTION_CATEGORY_PROPS_TAB,
            PREDICTION_CATEGORY_GROUPS_TAB,
            PREDICTION_CATEGORY_BRACKET_TAB,
        ])
            .withDefault(PREDICTION_CATEGORY_GAMES_TAB)
            .withOptions({ clearOnDefault: true, history: 'replace' }),
    );

    const tabAvailability = useCategoryGamesPropsAvailability({
        context,
        tabFromUrl: tab,
    });

    const needsTabAvailability = context ? shouldShowGamesPropsTabs(context) : false;
    const isGroupsTabSelected = tab === PREDICTION_CATEGORY_GROUPS_TAB && tabAvailability.hasGroups;
    const isTabAvailabilityPending = needsTabAvailability && tabAvailability.isPending && !isGroupsTabSelected;

    const effectiveTab = !showGamesList
        ? PREDICTION_CATEGORY_PROPS_TAB
        : isLiveGamesOnly
          ? tabAvailability.effectiveTab === PREDICTION_CATEGORY_GROUPS_TAB
              ? PREDICTION_CATEGORY_GROUPS_TAB
              : PREDICTION_CATEGORY_GAMES_TAB
          : isTabAvailabilityPending
            ? tab
            : tabAvailability.effectiveTab;

    const handleTabChange = useCallback(
        (nextTab: PredictionCategoryTab) => {
            void setTab(nextTab);
        },
        [setTab],
    );

    if (shouldRedirectToDefaultSecondary || shouldRedirectToDefaultPeriod) {
        return (
            <div className="flex flex-col">
                <PredictionCategoryStickyNav />
                <div className="flex justify-center py-16">
                    <Loading />
                </div>
            </div>
        );
    }

    if (!context || !slugList) {
        return (
            <div className="flex flex-col">
                <PredictionCategoryStickyNav />
                <NotFound />
            </div>
        );
    }

    const isCryptoPrimary = context.primaryItem.slug === CRYPTO_PRIMARY_SLUG;
    const isCryptoQuickBuy = isCryptoPrimary && context.secondaryItem?.slug === CRYPTO_QUICK_BUY_SLUG;
    // Title follows the active secondary: "{All/Weekly/Monthly/Yearly} Crypto" for the period
    // roll-ups, "Crypto" for Quick Buy (its active period surfaces in the period switcher), otherwise
    // the tab label (Targets, …). Falls back to "Crypto" for the transient bare /crypto depth-1
    // state (immediately redirected to a secondary).
    const cryptoTitle = context.secondaryItem
        ? resolveCryptoCategoryTitle(locale, context.secondaryItem.label, context.secondaryItem.slug)
        : resolvePredictionCategoryLabel(locale, 'Crypto');
    const headerTitle = getCategoryHeaderLabel(context.activeItem);
    const showCategoryHeader = tabAvailability.showTabSwitcher || !isLiveGamesOnly;
    const hasHeader = isCryptoPrimary || showCategoryHeader;
    const isFifa = context.secondaryItem?.slug === FIFA_SLUG;
    const isNotFeeds = tab === PREDICTION_CATEGORY_GROUPS_TAB || tab === PREDICTION_CATEGORY_BRACKET_TAB;

    return (
        <div className={classNames('flex flex-col', isNotFeeds ? 'h-screen' : null)}>
            <PredictionCategoryStickyNav slugs={slugList} context={context} />
            {isCryptoPrimary ? (
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <h1 className="min-w-0 truncate text-2xl font-black text-main max-md:hidden">{cryptoTitle}</h1>
                    {isCryptoQuickBuy ? <PredictionCategoryCryptoPeriodSwitcher context={context} /> : null}
                </div>
            ) : showCategoryHeader ? (
                <PredictionCategoryHeader
                    title={headerTitle}
                    tab={effectiveTab}
                    availableTabs={tabAvailability.showTabSwitcher ? tabAvailability.availableTabs : []}
                    onTabChange={handleTabChange}
                    categorySlug={context.activeItem.slug}
                />
            ) : null}
            <div
                className={classNames(
                    !hasHeader ? 'pt-3' : '',
                    isNotFeeds ? 'no-scrollbar min-h-0 grow overflow-auto' : '',
                )}
            >
                {isCryptoPrimary ? (
                    <ErrorBoundary>
                        <Suspense
                            fallback={
                                <div className="flex justify-center py-12">
                                    <Loading />
                                </div>
                            }
                        >
                            <PredictionCategoryCryptoPropsList context={context} />
                        </Suspense>
                    </ErrorBoundary>
                ) : isTabAvailabilityPending ? (
                    <div className="flex justify-center py-12">{isFifa ? <FootballLoading /> : <Loading />}</div>
                ) : effectiveTab === PREDICTION_CATEGORY_GAMES_TAB ? (
                    <PredictionCategoryGamesList context={context} />
                ) : effectiveTab === PREDICTION_CATEGORY_GROUPS_TAB ? (
                    <PredictionCategoryGroupsList />
                ) : effectiveTab === PREDICTION_CATEGORY_BRACKET_TAB ? (
                    <PredictionCategoryBracketList />
                ) : (
                    <Suspense
                        fallback={
                            <div className="flex justify-center py-12">
                                {isFifa ? <FootballLoading /> : <Loading />}
                            </div>
                        }
                    >
                        <PredictionCategoryPropsList context={context} initialPropsListPage={initialPropsListPage} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}
