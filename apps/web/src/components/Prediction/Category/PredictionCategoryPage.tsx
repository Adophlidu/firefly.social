'use client';

import { useQuery } from '@tanstack/react-query';
import { parseAsStringEnum, useQueryState } from 'nuqs';
import { Suspense, useCallback, useMemo } from 'react';

import { Loading } from '@/components/Loading.js';
import { NotFound } from '@/components/NotFound.js';
import { PredictionCategoryGamesList } from '@/components/Prediction/Category/PredictionCategoryGamesList.js';
import { PredictionCategoryHeader } from '@/components/Prediction/Category/PredictionCategoryHeader.js';
import { PredictionCategoryPrimaryTabs } from '@/components/Prediction/Category/PredictionCategoryPrimaryTabs.js';
import { PredictionCategoryPropsList } from '@/components/Prediction/Category/PredictionCategoryPropsList.js';
import { PredictionCategorySecondaryNav } from '@/components/Prediction/Category/PredictionCategorySecondaryNav.js';
import { PredictionCategoryToolbar } from '@/components/Prediction/Category/PredictionCategoryToolbar.js';
import { STALE_TIMES } from '@/constants/query.js';
import {
    PREDICTION_CATEGORY_GAMES_TAB,
    PREDICTION_CATEGORY_PROPS_TAB,
    type PredictionCategoryTab,
} from '@/helpers/prediction/category/constants.js';
import { getCategoryHeaderLabel } from '@/helpers/prediction/category/formatPolymarketSportsEventForUI.js';
import { isSportsLiveCategoryContext } from '@/helpers/prediction/category/isSportsLiveCategoryContext.js';
import { resolveCategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { shouldShowGamesPropsTabs, shouldShowGamesTab } from '@/helpers/prediction/category/shouldShowGamesTab.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';

interface Props {
    slug: string;
}

export function PredictionCategoryPage({ slug }: Props) {
    const { data: slugs, isPending } = useQuery({
        queryKey: ['prediction', 'category', 'slugs-list'],
        queryFn: () => getEventSlugList(),
        staleTime: STALE_TIMES.INFINITY,
    });

    const context = useMemo(() => {
        if (!slugs) return null;
        return resolveCategorySlugContext(slugs, slug);
    }, [slugs, slug]);

    const showGamesList = shouldShowGamesTab(context?.activeItem);
    const showGamesPropsTabs = context ? shouldShowGamesPropsTabs(context) : false;
    const isLiveGamesOnly = context ? isSportsLiveCategoryContext(context) : false;
    const defaultTab = showGamesList ? PREDICTION_CATEGORY_GAMES_TAB : PREDICTION_CATEGORY_PROPS_TAB;

    const [tab, setTab] = useQueryState(
        'tab',
        parseAsStringEnum<PredictionCategoryTab>([PREDICTION_CATEGORY_GAMES_TAB, PREDICTION_CATEGORY_PROPS_TAB])
            .withDefault(defaultTab)
            .withOptions({ clearOnDefault: true }),
    );

    const effectiveTab = !showGamesList
        ? PREDICTION_CATEGORY_PROPS_TAB
        : isLiveGamesOnly
          ? PREDICTION_CATEGORY_GAMES_TAB
          : tab;

    const handleTabChange = useCallback(
        (nextTab: PredictionCategoryTab) => {
            void setTab(nextTab);
        },
        [setTab],
    );

    if (isPending) {
        return (
            <div className="flex flex-col">
                <PredictionCategoryToolbar />
                <div className="flex justify-center py-16">
                    <Loading />
                </div>
            </div>
        );
    }

    if (!context || !slugs) {
        return (
            <div className="flex flex-col">
                <PredictionCategoryToolbar />
                <NotFound />
            </div>
        );
    }

    const headerTitle = getCategoryHeaderLabel(context.activeItem);

    return (
        <div className="flex flex-col">
            <PredictionCategoryToolbar />
            <div className="flex flex-col gap-3">
                <PredictionCategoryPrimaryTabs slugs={slugs} context={context} />
                <PredictionCategorySecondaryNav context={context} />
            </div>
            <PredictionCategoryHeader
                title={headerTitle}
                tab={effectiveTab}
                showGames={showGamesPropsTabs}
                onTabChange={handleTabChange}
            />
            {effectiveTab === PREDICTION_CATEGORY_GAMES_TAB ? (
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
    );
}
