import type { LayoutProps } from '@dimensiondev/types';
import { msg } from '@lingui/core/macro';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { ExploreSourceTabs } from '@/components/Explores/ExploreSourceTabs.js';
import { NoSSR } from '@/components/NoSSR.js';
import { PredictionSourceNav } from '@/components/SourceNav/PredictionSourceNav.js';
import { queryClientConfig } from '@/configs/queryClient.js';
import { ExploreType } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { logger } from '@/libs/Logger.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';

export function generateStaticParams() {
    return Object.values(ExploreType).map((explore) => ({ explore }));
}

interface Props extends LayoutProps<{ explore: string }> {}

export async function generateMetadata(props: Props) {
    const { explore } = await props.params;

    return createSiteMetadata(`/explore/${explore}`, {
        title: await createPageTitleSSR(msg`Explore`),
    });
}

export default async function Layout(props: Props) {
    const explore = (await props.params).explore as ExploreType;

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
                <NoSSR>
                    {explore === ExploreType.Prediction ? (
                        <PredictionSourceNav className="bg-primaryBottom sticky top-[98px] z-20 md:!top-[103px]" />
                    ) : null}
                </NoSSR>
            </HydrationBoundary>
            {props.children}
        </>
    );
}
