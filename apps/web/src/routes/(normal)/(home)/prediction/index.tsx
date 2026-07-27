import { Suspense } from 'react';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { DiscoverPredictionTimeline } from '@/components/Prediction/DiscoverPredictionTimeline.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function head() {
    return fromNextMetadata(createSiteMetadata('/prediction'));
}

export default function DiscoverBetsPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <DiscoverPredictionTimeline />
            </Suspense>
        </NoSSR>
    );
}
