import { Suspense } from 'react';

import { ForYouActivities } from '@/components/Activities/ForYouActivities.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';

export default function Page() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <ForYouActivities />
            </Suspense>
        </NoSSR>
    );
}
