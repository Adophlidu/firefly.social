import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FollowingPredictionTimeline } from '@/components/Prediction/FollowingPredictionTimeline.js';

export default function FollowingBetsPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingPredictionTimeline />
            </Suspense>
        </NoSSR>
    );
}
