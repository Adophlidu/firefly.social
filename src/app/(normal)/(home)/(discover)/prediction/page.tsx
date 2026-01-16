import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { DiscoverPredictionTimeline } from '@/components/Prediction/DiscoverPredictionTimeline.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/prediction');

export default function DiscoverBets() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <DiscoverPredictionTimeline />
            </Suspense>
        </NoSSR>
    );
}
