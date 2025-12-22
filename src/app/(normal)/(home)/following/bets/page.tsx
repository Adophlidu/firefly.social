import { Suspense } from 'react';

import { FollowingBetsTimeline } from '@/components/Bets/FollowingBetsTimeline.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function FollowingBetsPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingBetsTimeline />
            </Suspense>
        </NoSSR>
    );
}
