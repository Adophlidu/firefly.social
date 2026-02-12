import { msg } from '@lingui/core/macro';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { first } from 'lodash-es';
import urlcat from 'urlcat';

import { ExploreSourceTabs } from '@/components/Explores/ExploreSourceTabs.js';
import { PredictionSourceNav } from '@/components/SourceNav/PredictionSourceNav.js';
import { queryClientConfig } from '@/configs/queryClient.js';
import { EXPLORE_TYPES } from '@/constants/computed.js';
import { ExploreType } from '@/constants/enum.js';
import { NFT_ENABLED } from '@/constants/static.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { logger } from '@/libs/Logger.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
import { POLYMARKET_FIREFLY_SLUG } from '@/providers/prediction/polymarket/constants.js';
import { type NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ explore: ExploreType }> {}

export async function generateMetadata(props: Props) {
    const { explore } = await props.params;

    return createSiteMetadata(`/explore/${explore}`, {
        title: await createPageTitleSSR(msg`Explore`),
    });
}

export default async function Layout(props: Props) {
    await setupLocaleForSSR();

    const { explore } = await props.params;

    const queryClient = new QueryClient(queryClientConfig);
    let exploreTypes = EXPLORE_TYPES.filter((x) => (NFT_ENABLED ? true : x !== ExploreType.NFTs)).map((type) => ({
        type,
        id: `${type}`,
        link: '',
        label: '',
    }));

    try {
        const slugsData = await queryClient.fetchQuery({
            queryKey: ['bets', 'slugs-list'],
            staleTime: Infinity,
            queryFn: () => getEventSlugList(),
        });
        const fireflySlug = slugsData?.find((x) => x.slug === POLYMARKET_FIREFLY_SLUG);
        if (fireflySlug) {
            const firstSubSlug = first(fireflySlug.sub_slug)?.slug;
            exploreTypes.unshift({
                type: ExploreType.Bets,
                id: POLYMARKET_FIREFLY_SLUG,
                label: fireflySlug.label,
                link: urlcat('/explore/prediction/:slug', {
                    slug: POLYMARKET_FIREFLY_SLUG,
                    subSlug: firstSubSlug || undefined,
                }),
            });
        }
        const firstSlug = slugsData.find((x) => x.slug !== POLYMARKET_FIREFLY_SLUG)?.slug;
        if (firstSlug) {
            exploreTypes = exploreTypes.map((x) => {
                if (x.type === ExploreType.Bets && x.id === ExploreType.Bets) {
                    return { ...x, link: `/explore/prediction/${firstSlug}` };
                }

                return x;
            });
        }
    } catch (error) {
        logger.error('Error fetching prediction slugs list', { error });
    }

    return (
        <>
            <ExploreSourceTabs exploreTypes={exploreTypes} explore={explore} />
            {explore === ExploreType.Bets ? (
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <PredictionSourceNav className="sticky top-[98px] z-20 bg-primaryBottom md:!top-[103px]" />
                </HydrationBoundary>
            ) : null}
            {props.children}
        </>
    );
}
