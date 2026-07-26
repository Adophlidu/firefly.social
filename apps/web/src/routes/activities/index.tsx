import { Suspense } from 'react';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { ForYouActivities } from '@/components/Activities/ForYouActivities.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function head() {
    return fromNextMetadata(createSiteMetadata('/activities'));
}

export default function ActivitiesPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <ForYouActivities />
            </Suspense>
        </NoSSR>
    );
}
