import type { Pageable, PageIndicator } from '@dimensiondev/utils';
import type { InfiniteData } from '@tanstack/react-query';

import { SSR_LIST_LIMIT } from '@/constants/ssr.js';
import { compactChannelForPageTransfer } from '@/helpers/compactChannelForPageTransfer.js';
import type { Channel } from '@/providers/types/SocialMedia.js';

export type ExploreChannelsInitialData = InfiniteData<Pageable<Channel, PageIndicator>, string>;

export function buildExploreChannelsInitialData(
    page: Pageable<Channel, PageIndicator>,
): ExploreChannelsInitialData | undefined {
    if (!page.data.length) return undefined;

    return {
        pages: [
            {
                ...page,
                data: page.data.slice(0, SSR_LIST_LIMIT).map(compactChannelForPageTransfer),
            },
        ],
        pageParams: [''],
    };
}
