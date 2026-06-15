'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
    categoryHasGamesDisplayContent,
    categoryHasPropsDisplayContent,
    resolveCategoryGamesPropsTabs,
    type ResolveCategoryGamesPropsTabsResult,
} from '@/helpers/prediction/category/categoryGamesPropsTabAvailability.js';
import type { PredictionCategoryTab } from '@/helpers/prediction/category/constants.js';
import { FIFA_EXCLUDE_TAG_ID, isFifaCategoryContext } from '@/helpers/prediction/category/isFifaCategoryContext.js';
import {
    getCategoryPropsTagSlug,
    parseSportsListRequest,
} from '@/helpers/prediction/category/parseCategoryRouteParams.js';
import type { CategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { shouldShowGamesPropsTabs } from '@/helpers/prediction/category/shouldShowGamesTab.js';
import { useLocale } from '@/hooks/useLocale.js';
import { getGammaEvents } from '@/providers/firefly/prediction/getGammaEvents.js';
import { getSportsEventList } from '@/providers/firefly/prediction/getSportsEventList.js';

interface Options {
    context: CategorySlugContext | null;
    tabFromUrl: PredictionCategoryTab;
}

export function useCategoryGamesPropsAvailability({
    context,
    tabFromUrl,
}: Options): ResolveCategoryGamesPropsTabsResult & {
    hasGames: boolean;
    hasProps: boolean;
    hasGroups: boolean;
    isPending: boolean;
} {
    const showGamesPropsTabs = context ? shouldShowGamesPropsTabs(context) : false;
    const hasGroups = isFifaCategoryContext(context);

    const locale = useLocale();

    const sportsRequest = useMemo(
        () => (context && showGamesPropsTabs ? parseSportsListRequest(context) : null),
        [context, showGamesPropsTabs],
    );

    const propsTagSlug = useMemo(
        () => (context && showGamesPropsTabs ? getCategoryPropsTagSlug(context) : undefined),
        [context, showGamesPropsTabs],
    );

    const gamesQuery = useQuery({
        queryKey: ['prediction', 'category', 'sports-list', sportsRequest],
        queryFn: () => getSportsEventList(sportsRequest!),
        enabled: !!sportsRequest,
        select: categoryHasGamesDisplayContent,
    });

    const propsQuery = useQuery({
        queryKey: ['prediction', 'category', 'gamma-events-availability', propsTagSlug, locale],
        queryFn: () =>
            getGammaEvents({
                tag_slug: propsTagSlug!,
                limit: 1,
                offset: 0,
                exclude_tag_id: FIFA_EXCLUDE_TAG_ID,
                locale,
            }),
        enabled: !!propsTagSlug,
        select: categoryHasPropsDisplayContent,
    });

    const propsAvailabilityReady = !propsTagSlug || propsQuery.isFetched;
    const isAvailabilityReady = !showGamesPropsTabs || (gamesQuery.isFetched && propsAvailabilityReady);
    const isPending = showGamesPropsTabs && !isAvailabilityReady;
    const hasGames = isAvailabilityReady ? (gamesQuery.data ?? false) : false;
    const hasProps = isAvailabilityReady && propsTagSlug ? (propsQuery.data ?? false) : false;

    const resolved = useMemo(
        () =>
            resolveCategoryGamesPropsTabs({
                showGamesPropsTabs,
                hasGames,
                hasProps,
                hasGroups,
                tabFromUrl,
                isAvailabilityPending: isPending,
            }),
        [showGamesPropsTabs, hasGames, hasProps, hasGroups, tabFromUrl, isPending],
    );

    return {
        ...resolved,
        hasGames,
        hasProps,
        hasGroups,
        isPending,
    };
}
