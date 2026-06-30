import { SOCIAL_DISCOVER_SOURCE } from '@dimensiondev/constants/computed';
import { Source } from '@dimensiondev/enums';
import { getMultiInfiniteQueryPageableFetchOptions } from '@dimensiondev/hooks/getMultiInfiniteQueryPageableFetchOptions';
import { createIndicator, runInSafeAsync } from '@dimensiondev/utils';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { DiscoverPostList } from '@/components/Posts/DiscoverPostList.js';
import { queryClientConfig } from '@/configs/queryClient.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';

export const metadata = createSiteMetadata('/posts');

export const revalidate = 60;

export default async function Posts() {
    // Anonymously prefetch the default (no-filter) discover feed so it ships in the initial
    // HTML (ISR-cached, crawlable) instead of being a client-only shell. The key must match
    // DiscoverPostList's when no source filter is selected: ['posts', Source.Posts, 'discover'].
    // Relationship fields (hasLiked, …) stay empty here; the client fills them in on mount.
    const queryClient = new QueryClient(queryClientConfig);
    await runInSafeAsync(() =>
        queryClient.prefetchInfiniteQuery(
            getMultiInfiniteQueryPageableFetchOptions(
                ['posts', Source.Posts, 'discover'],
                SOCIAL_DISCOVER_SOURCE.map((source) => ({
                    key: source,
                    queryFn: ({ pageParam }) => {
                        const indicator = pageParam ? createIndicator(undefined, pageParam) : undefined;
                        return resolveSocialMediaProvider(source).discoverPosts(indicator);
                    },
                })),
            ),
        ),
    );

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<Loading />}>
                <DiscoverPostList source={Source.Posts} />
            </Suspense>
        </HydrationBoundary>
    );
}
