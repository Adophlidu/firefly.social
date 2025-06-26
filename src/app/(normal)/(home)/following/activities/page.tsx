import { Suspense } from 'react';

import { FollowingActivities } from '@/components/Activities/FollowingActivities.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/following/activities');

export default function Activities() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingActivities />
            </Suspense>
        </NoSSR>
    );
}
