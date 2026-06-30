import { type ExploreSourceInURL, ExploreType, type SocialSource } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { createIndicator, type Pageable, type PageIndicator, runInSafeAsync } from '@dimensiondev/utils';
import { msg } from '@lingui/core/macro';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { queryClientConfig } from '@/configs/queryClient.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSocialMediaProvider } from '@/helpers/resolveSocialMediaProvider.js';
import { resolveSourceFromUrl } from '@/helpers/resolveSource.js';

interface Props extends LayoutProps<{ source: string; explore: string }> {}

function resolveExplorePageTitle(explore: string) {
    if (explore === ExploreType.TopChannels) {
        return msg`Explore - Trending clubs from Farcaster, Lens and Bluesky - Firefly`;
    }

    if (explore === ExploreType.Prediction) {
        return msg`Prediction`;
    }

    return msg`Explore`;
}

export async function generateMetadata(props: Props) {
    const { explore, source } = await props.params;
    return createSiteMetadata(`/explore/${explore}/${source}`, {
        title: await createPageTitleSSR(resolveExplorePageTitle(explore), {
            withSiteName: explore !== ExploreType.TopChannels,
        }),
    });
}

// Anonymously prefetch the trending clubs list so it ships in the initial HTML (crawlable,
// fast first paint). The key/queryFn mirror ChannelList for the logged-out default; logged-in
// viewers use a profile-scoped key and fetch on the client.
async function prefetchTrendingChannels(queryClient: QueryClient, source: string) {
    const socialSource = resolveSourceFromUrl(source as ExploreSourceInURL) as SocialSource;
    await queryClient.prefetchInfiniteQuery({
        queryKey: ['channels', socialSource, 'trending', undefined],
        queryFn: ({ pageParam }) =>
            resolveSocialMediaProvider(socialSource).discoverChannels(createIndicator(undefined, pageParam)),
        initialPageParam: '',
        getNextPageParam: (lastPage: Pageable<unknown, PageIndicator>) => lastPage.nextIndicator?.id,
    });
}

export default async function Layout(props: Props) {
    const { explore, source } = await props.params;

    // Only TopChannels is server-rendered. Other [source] types (CryptoTrends, Prediction,
    // TopProfiles) keep their original client-only rendering — pre-rendering them here exposed
    // item-level hydration mismatches (token row attributes, prediction countdowns). Returning
    // children untouched preserves their exact prior behaviour; SSR them once those item
    // components are hydration-safe.
    if (explore !== ExploreType.TopChannels) return <>{props.children}</>;

    const queryClient = new QueryClient(queryClientConfig);
    await runInSafeAsync(() => prefetchTrendingChannels(queryClient, source));

    return <HydrationBoundary state={dehydrate(queryClient)}>{props.children}</HydrationBoundary>;
}
