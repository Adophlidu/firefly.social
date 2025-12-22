import { Suspense } from 'react';

import { DiscoverBetsTimeline } from '@/components/Bets/DiscoverBetsTimeline.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/bets');

export default function DiscoverBets() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <DiscoverBetsTimeline />
            </Suspense>
        </NoSSR>
    );
}
