import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { WorldCupTimeline } from '@/components/Prediction/WorldCupTimeline.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function head() {
    return createSiteMetadata('/world-cup-feed');
}

export default function WorldCupFeedPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <WorldCupTimeline />
            </Suspense>
        </NoSSR>
    );
}
