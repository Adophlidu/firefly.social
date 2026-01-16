import { msg } from '@lingui/core/macro';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { ExploreSourceNav } from '@/components/SourceNav/ExploreSourceNav.js';
import { PredictionSourceNav } from '@/components/SourceNav/PredictionSourceNav.js';
import { queryClientConfig } from '@/configs/queryClient.js';
import { type ExploreSourceInURL, ExploreType } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import { type NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ source: string; explore: ExploreType }> {}

export async function generateMetadata(props: Props) {
    const { explore, source } = await props.params;
    return createSiteMetadata(`/explore/${explore}/${source}`, {
        title: await createPageTitleSSR(
            explore === ExploreType.TopChannels
                ? msg`Explore - Trending clubs from Farcaster, Lens and Bluesky - Firefly`
                : msg`Explore`,
            {
                withSiteName: explore !== ExploreType.TopChannels,
            },
        ),
    });
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const { source, explore } = await props.params;

    const queryClient = new QueryClient(queryClientConfig);

    if (explore === ExploreType.Bets) {
        await queryClient.prefetchQuery({
            queryKey: ['bets', 'slugs-list'],
            queryFn: () => getEventSlugList(),
        });
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            {explore === ExploreType.Bets ? (
                <PredictionSourceNav
                    className="sticky top-[98px] z-20 bg-primaryBottom md:!top-[103px]"
                    source={source}
                />
            ) : (
                <ExploreSourceNav
                    explore={explore}
                    source={source as ExploreSourceInURL}
                    className="sticky top-[98px] z-20 bg-primaryBottom md:!top-[103px]"
                />
            )}
            {props.children}
        </HydrationBoundary>
    );
}
