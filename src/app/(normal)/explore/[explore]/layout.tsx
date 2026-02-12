import { msg } from '@lingui/core/macro';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { ExploreSourceTabs } from '@/components/Explores/ExploreSourceTabs.js';
import { PredictionSourceNav } from '@/components/SourceNav/PredictionSourceNav.js';
import { queryClientConfig } from '@/configs/queryClient.js';
import { ExploreType } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { logger } from '@/libs/Logger.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';
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
    try {
        await queryClient.fetchQuery({
            queryKey: ['bets', 'slugs-list'],
            queryFn: () => getEventSlugList(),
        });
    } catch (error) {
        logger.error('Error fetching prediction slugs list', { error });
    }

    return (
        <>
            <HydrationBoundary state={dehydrate(queryClient)}>
                <ExploreSourceTabs explore={explore} />
                {explore === ExploreType.Bets ? (
                    <PredictionSourceNav className="sticky top-[98px] z-20 bg-primaryBottom md:!top-[103px]" />
                ) : null}
            </HydrationBoundary>
            {props.children}
        </>
    );
}
