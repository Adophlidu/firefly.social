import { Suspense } from 'react';

import { ForYouActivities } from '@/components/Activities/ForYouActivities.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/activities');

export default function Page() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <ForYouActivities />
            </Suspense>
        </NoSSR>
    );
}
