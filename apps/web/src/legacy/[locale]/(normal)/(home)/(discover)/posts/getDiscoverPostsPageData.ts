import { SOCIAL_DISCOVER_SOURCE } from '@dimensiondev/constants/computed';
import { Source } from '@dimensiondev/enums';
import { getMultiInfiniteQueryPageableFetchOptions } from '@dimensiondev/hooks/getMultiInfiniteQueryPageableFetchOptions';
import { createIndicator, runInSafeAsync } from '@dimensiondev/utils';
import { cache } from 'react';

import { buildDiscoverFeedInitialData, type DiscoverFeedInitialData } from '@/helpers/buildDiscoverFeedInitialData.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';

export const getDiscoverPostsPageData = cache(async (): Promise<DiscoverFeedInitialData | undefined> => {
    const fetchOptions = getMultiInfiniteQueryPageableFetchOptions(
        ['posts', Source.Posts, 'discover'],
        SOCIAL_DISCOVER_SOURCE.map((source) => ({
            key: source,
            queryFn: ({ pageParam }) => {
                const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;
                return resolveSocialMediaProvider(source).discoverPosts(indicator);
            },
        })),
    );

    const page = await runInSafeAsync(() => fetchOptions.queryFn({ pageParam: fetchOptions.initialPageParam }));
    if (!page?.data.length) return undefined;
    return buildDiscoverFeedInitialData(page, fetchOptions.initialPageParam);
});
