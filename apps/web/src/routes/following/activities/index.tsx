import { Suspense } from 'react';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { FollowingActivities } from '@/components/Activities/FollowingActivities.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function head() {
    return fromNextMetadata(createSiteMetadata('/following/activities'));
}

export default function FollowingActivitiesPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingActivities />
            </Suspense>
        </NoSSR>
    );
}
