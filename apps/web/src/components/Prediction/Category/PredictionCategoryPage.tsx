'use client';

import { useQuery } from '@tanstack/react-query';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { Suspense, useCallback, useEffect, useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { NotFound } from '@/components/NotFound.js';
import { PredictionCategoryGamesList } from '@/components/Prediction/Category/PredictionCategoryGamesList.js';
import { PredictionCategoryHeader } from '@/components/Prediction/Category/PredictionCategoryHeader.js';
import { PredictionCategoryPrimaryTabs } from '@/components/Prediction/Category/PredictionCategoryPrimaryTabs.js';
import { PredictionCategoryPropsList } from '@/components/Prediction/Category/PredictionCategoryPropsList.js';
import { PredictionCategorySecondaryNav } from '@/components/Prediction/Category/PredictionCategorySecondaryNav.js';
import { PredictionCategoryToolbar } from '@/components/Prediction/Category/PredictionCategoryToolbar.js';
import { STALE_TIMES } from '@/constants/query.js';
import { useRouter } from '@/esm/navigation.js';
import { buildPredictionCategoryHref } from '@/helpers/prediction/category/buildPredictionCategoryHref.js';
import {
    PREDICTION_CATEGORY_GAMES_TAB,
    PREDICTION_CATEGORY_PROPS_TAB,
    type PredictionCategoryTab,
} from '@/helpers/prediction/category/constants.js';
import { getCategoryHeaderLabel } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { getDefaultSecondaryCategoryItem } from '@/helpers/prediction/category/getDefaultSecondaryCategoryItem.js';
import { isSportsLiveCategoryContext } from '@/helpers/prediction/category/isSportsLiveCategoryContext.js';
import type { CategoryRouteSearchParams } from '@/helpers/prediction/category/parseCategoryRouteParams.js';
import {
    type CategorySlugContext,
    resolveCategorySlugContext,
} from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { shouldShowGamesPropsTabs, shouldShowGamesTab } from '@/helpers/prediction/category/shouldShowGamesTab.js';
import { useCategoryGamesPropsAvailability } from '@/hooks/prediction/useCategoryGamesPropsAvailability.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    slug: string;
}

function PredictionCategoryStickyNav({
    slugs,
    context,
}: {
    slugs?: PolymarketEventSlugListData[];
    context?: CategorySlugContext;
}) {
    return (
        <div className="sticky top-0 z-30 bg-primaryBottom">
            <PredictionCategoryToolbar />
            {slugs && context ? (
                <div className="flex flex-col gap-3">
                    <PredictionCategoryPrimaryTabs slugs={slugs} context={context} />
                    <PredictionCategorySecondaryNav context={context} />
                </div>
            ) : null}
        </div>
    );
}

export function PredictionCategoryPage({ slug }: Props) {
    const router = useRouter();
    const { data: slugs, isPending } = useQuery({
        queryKey: ['prediction', 'category', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: STALE_TIMES.INFINITY,
    });

    const [parentSlug] = useQueryState('parentSlug', parseAsString);
    const [parentTagType] = useQueryState('parentTagType', parseAsString);

    const routeParams = useMemo<CategoryRouteSearchParams>(
        () => ({
            parentSlug,
            parentTagType,
        }),
        [parentSlug, parentTagType],
    );

    const context = useMemo(() => {
        if (!slugs) return null;
        return resolveCategorySlugContext(slugs, slug, routeParams);
    }, [slugs, slug, routeParams]);

    const shouldRedirectToDefaultSecondary = useMemo(() => {
        if (context?.depth !== 1) return false;
        return !!getDefaultSecondaryCategoryItem(context.primaryItem);
    }, [context]);

    useEffect(() => {
        if (!shouldRedirectToDefaultSecondary || !context) return;

        const defaultSecondary = getDefaultSecondaryCategoryItem(context.primaryItem);
        if (!defaultSecondary) return;

        router.replace(buildPredictionCategoryHref(defaultSecondary));
    }, [context, router, shouldRedirectToDefaultSecondary]);

    const showGamesList = shouldShowGamesTab(context?.activeItem);
    const isLiveGamesOnly = context ? isSportsLiveCategoryContext(context) : false;
    const defaultTab = showGamesList ? PREDICTION_CATEGORY_GAMES_TAB : PREDICTION_CATEGORY_PROPS_TAB;

    const [tab, setTab] = useQueryState(
        'tab',
        parseAsStringEnum<PredictionCategoryTab>([PREDICTION_CATEGORY_GAMES_TAB, PREDICTION_CATEGORY_PROPS_TAB])
            .withDefault(defaultTab)
            .withOptions({ clearOnDefault: true, history: 'replace' }),
    );

    const tabAvailability = useCategoryGamesPropsAvailability({
        context,
        tabFromUrl: tab,
    });

    const needsTabAvailability = context ? shouldShowGamesPropsTabs(context) : false;
    const isTabAvailabilityPending = needsTabAvailability && tabAvailability.isPending;

    const effectiveTab = !showGamesList
        ? PREDICTION_CATEGORY_PROPS_TAB
        : isLiveGamesOnly
          ? PREDICTION_CATEGORY_GAMES_TAB
          : isTabAvailabilityPending
            ? tab
            : tabAvailability.effectiveTab;

    const handleTabChange = useCallback(
        (nextTab: PredictionCategoryTab) => {
            void setTab(nextTab);
        },
        [setTab],
    );

    if (isPending || shouldRedirectToDefaultSecondary) {
        return (
            <div className="flex flex-col">
                <PredictionCategoryStickyNav />
                <div className="flex justify-center py-16">
                    <Loading />
                </div>
            </div>
        );
    }

    if (!context || !slugs) {
        return (
            <div className="flex flex-col">
                <PredictionCategoryStickyNav />
                <NotFound />
            </div>
        );
    }

    const headerTitle = getCategoryHeaderLabel(context.activeItem);
    const showCategoryHeader = tabAvailability.showTabSwitcher || !isLiveGamesOnly;

    return (
        <div className="flex flex-col">
            <PredictionCategoryStickyNav slugs={slugs} context={context} />
            {showCategoryHeader ? (
                <PredictionCategoryHeader
                    title={headerTitle}
                    tab={effectiveTab}
                    availableTabs={tabAvailability.showTabSwitcher ? tabAvailability.availableTabs : []}
                    onTabChange={handleTabChange}
                />
            ) : null}
            <div className={!showCategoryHeader ? 'pt-3' : ''}>
                {isTabAvailabilityPending ? (
                    <div className="flex justify-center py-12">
                        <Loading />
                    </div>
                ) : effectiveTab === PREDICTION_CATEGORY_GAMES_TAB ? (
                    <PredictionCategoryGamesList context={context} />
                ) : (
                    <Suspense
                        fallback={
                            <div className="flex justify-center py-12">
                                <Loading />
                            </div>
                        }
                    >
                        <PredictionCategoryPropsList context={context} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}
