import { ExploreType } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { ExploreSourceTabs } from '@/components/Explores/ExploreSourceTabs.js';
import { NoSSR } from '@/components/NoSSR.js';
import { PredictionSourceNav } from '@/components/SourceNav/PredictionSourceNav.js';
import { queryClientConfig } from '@/configs/queryClient.js';
import { logger } from '@/libs/Logger.js';
import { getEventSlugList } from '@/providers/firefly/prediction/getEventSlugList.js';

interface Props extends LayoutProps<{ explore: string }> {}

export default async function SubNav(props: Props) {
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
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ExploreSourceTabs explore={explore} />
            <NoSSR>
                {explore === ExploreType.Prediction ? <PredictionSourceNav className="bg-primaryBottom" /> : null}
            </NoSSR>
        </HydrationBoundary>
    );
}
