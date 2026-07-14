import { createIndicator, runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { FIFA_SLUG } from '@/constants/bets.js';
import {
    buildPredictionCategoryPropsInitialData,
    type PredictionCategoryPropsInitialData,
} from '@/helpers/buildPredictionCategoryPropsInitialData.js';
import { CRYPTO_PRIMARY_SLUG } from '@/helpers/prediction/category/constants.js';
import { enrichSlugListWithCryptoTree } from '@/helpers/prediction/category/enrichSlugListWithCryptoTree.js';
import { getDefaultSecondaryCategoryItem } from '@/helpers/prediction/category/getDefaultSecondaryCategoryItem.js';
import { getPropsListSlugParams } from '@/helpers/prediction/category/parseCategoryRouteParams.js';
import { resolveCategorySlugContext } from '@/helpers/prediction/category/resolveCategorySlugContext.js';
import { shouldShowGamesTab } from '@/helpers/prediction/category/shouldShowGamesTab.js';
import { resolveLocale } from '@/helpers/resolveLocale.js';
import { getEventList } from '@/providers/firefly/prediction/getEventList.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import type { PolymarketEventSlugListData } from '@/providers/types/Firefly.js';

export interface PredictionCategoryPageData {
    slugList: PolymarketEventSlugListData[];
    initialPropsListPage?: PredictionCategoryPropsInitialData;
}

export const getPredictionCategoryPageData = cache(
    async (slugs: string[], locale: string): Promise<PredictionCategoryPageData> => {
        const resolvedLocale = resolveLocale(locale);
        const slugListRaw = await runInSafeAsync(() => getEventSlugList());
        // Graft the frontend-defined Crypto tab tree so crypto/quick-buy/1h etc. resolve on SSR.
        const slugList = enrichSlugListWithCryptoTree((slugListRaw ?? []).filter((item) => item.slug !== FIFA_SLUG));

        const context = resolveCategorySlugContext(slugList, slugs);
        if (!context) {
            return { slugList };
        }

        if (context.depth === 1 && getDefaultSecondaryCategoryItem(context.primaryItem)) {
            return { slugList };
        }

        // Crypto lists are client-fetched via the gamma/events endpoints (see
        // PredictionCategoryCryptoPropsList) — skip the generic SSR props prefetch for them.
        if (context.primaryItem.slug === CRYPTO_PRIMARY_SLUG) {
            return { slugList };
        }

        if (shouldShowGamesTab(context.activeItem)) {
            return { slugList };
        }

        const { slug, subSlug } = getPropsListSlugParams(context);
        const page = await runInSafeAsync(() =>
            getEventList({
                slug,
                subSlug,
                indicator: createIndicator(undefined, ''),
                locale: resolvedLocale,
            }),
        );

        return {
            slugList,
            initialPropsListPage: page ? buildPredictionCategoryPropsInitialData(page) : undefined,
        };
    },
);
