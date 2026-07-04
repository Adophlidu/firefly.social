import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import type { InfiniteData } from '@tanstack/react-query';

import { SSR_LIST_LIMIT } from '@/constants/ssr.js';
import type { ActivityListItem } from '@/providers/types/Firefly.js';

export type ActivityListInitialData = InfiniteData<Pageable<ActivityListItem, PageIndicator>, string>;

export function buildActivityListInitialData(
    page: Pageable<ActivityListItem, PageIndicator>,
): ActivityListInitialData | undefined {
    if (!page.data.length) return undefined;

    return {
        pages: [
            {
                ...page,
                data: page.data.slice(0, SSR_LIST_LIMIT),
            },
        ],
        pageParams: [''],
    };
}
