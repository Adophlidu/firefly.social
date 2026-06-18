'use client';

import { useQuery } from '@tanstack/react-query';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { Suspense, useCallback, useEffect, useMemo } from 'react';

import { FootballLoading } from '@/components/FootballLoading.js';
import { Loading } from '@/components/Loading.js';
import { NotFound } from '@/components/NotFound.js';
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
import { buildPredictionCategoryHref } from '@/helpers/prediction/category/buildPredictionCategoryHref.js';
import {
    PREDICTION_CATEGORY_GAMES_TAB,
    PREDICTION_CATEGORY_GROUPS_TAB,
    PREDICTION_CATEGORY_PROPS_TAB,
    type PredictionCategoryTab,
} from '@/helpers/prediction/category/constants.js';
import { getCategoryHeaderLabel } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { getDefaultSecondaryCategoryItem } from '@/helpers/prediction/category/getDefaultSecondaryCategoryItem.js';
import { isSportsLiveCategoryContext } from '@/helpers/prediction/category/isSportsLiveCategoryContext.js';
import {
    type CategorySlugContext,
    resolveCategorySlugContext,
} from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { shouldShowGamesPropsTabs, shouldShowGamesTab } from '@/helpers/prediction/category/shouldShowGamesTab.js';
import { useCategoryGamesPropsAvailability } from '@/hooks/prediction/useCategoryGamesPropsAvailability.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

interface Props {
    slugs: string[];
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
                    <PredictionCategorySecondaryNav slugs={slugs} context={context} />
                </div>
            ) : null}
        </div>
    );
}

export function PredictionCategoryPage({ slugs }: Props) {
    const router = useRouter();
    const { data: slugList, isPending } = useQuery({
        queryKey: ['prediction', 'category', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: STALE_TIMES.INFINITY,
        select: (data) => data?.filter((x) => x.slug !== FIFA_SLUG),
    });

    const context = useMemo(() => {
        if (!slugList) return null;
        return resolveCategorySlugContext(slugList, slugs);
    }, [slugList, slugs]);

    const shouldRedirectToDefaultSecondary = useMemo(() => {
        if (context?.depth !== 1) return false;
        return !!getDefaultSecondaryCategoryItem(context.primaryItem);
    }, [context]);

    useEffect(() => {
        if (!shouldRedirectToDefaultSecondary || !context) return;

        const defaultSecondary = getDefaultSecondaryCategoryItem(context.primaryItem);
        if (!defaultSecondary) return;

        router.replace(buildPredictionCategoryHref(defaultSecondary, [context.primaryItem]));
    }, [context, router, shouldRedirectToDefaultSecondary]);

    const showGamesList = shouldShowGamesTab(context?.activeItem);
    const isLiveGamesOnly = context ? isSportsLiveCategoryContext(context) : false;

    const [tab, setTab] = useQueryState(
        'tab',
        parseAsStringEnum<PredictionCategoryTab>([
            PREDICTION_CATEGORY_GAMES_TAB,
            PREDICTION_CATEGORY_PROPS_TAB,
            PREDICTION_CATEGORY_GROUPS_TAB,
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

    if (!context || !slugList) {
        return (
            <div className="flex flex-col">
                <PredictionCategoryStickyNav />
                <NotFound />
            </div>
        );
    }

    const headerTitle = getCategoryHeaderLabel(context.activeItem);
    const showCategoryHeader = tabAvailability.showTabSwitcher || !isLiveGamesOnly;
    const isFifa = context.secondaryItem?.slug === FIFA_SLUG;

    return (
        <div className="flex flex-col">
            <PredictionCategoryStickyNav slugs={slugList} context={context} />
            {showCategoryHeader ? (
                <PredictionCategoryHeader
                    title={headerTitle}
                    tab={effectiveTab}
                    availableTabs={tabAvailability.showTabSwitcher ? tabAvailability.availableTabs : []}
                    onTabChange={handleTabChange}
                    categorySlug={context.activeItem.slug}
                />
            ) : null}
            <div className={!showCategoryHeader ? 'pt-3' : ''}>
                {isTabAvailabilityPending ? (
                    <div className="flex justify-center py-12">{isFifa ? <FootballLoading /> : <Loading />}</div>
                ) : effectiveTab === PREDICTION_CATEGORY_GAMES_TAB ? (
                    <PredictionCategoryGamesList context={context} />
                ) : effectiveTab === PREDICTION_CATEGORY_GROUPS_TAB ? (
                    <PredictionCategoryGroupsList />
                ) : (
                    <Suspense
                        fallback={
                            <div className="flex justify-center py-12">
                                {isFifa ? <FootballLoading /> : <Loading />}
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
