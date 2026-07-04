import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import type { InfiniteData } from '@tanstack/react-query';

import { SSR_LIST_LIMIT } from '@/constants/ssr.js';
import { compactPolymarketEventListForPageTransfer } from '@/helpers/compactPolymarketEventListDataForPageTransfer.js';
import type { PolymarketEventListData } from '@/providers/types/Firefly.js';

export type PredictionCategoryPropsInitialData = InfiniteData<
    Pageable<PolymarketEventListData, PageIndicator> | undefined,
    string
>;

export function buildPredictionCategoryPropsInitialData(
    page: Pageable<PolymarketEventListData, PageIndicator>,
): PredictionCategoryPropsInitialData | undefined {
    if (!page.data.length) return undefined;

    return {
        pages: [
            {
                ...page,
                data: compactPolymarketEventListForPageTransfer(page.data.slice(0, SSR_LIST_LIMIT)),
            },
        ],
        pageParams: [''],
    };
}
