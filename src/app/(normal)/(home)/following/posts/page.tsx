import { msg } from '@lingui/core/macro';
import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FollowingPosts } from '@/components/Posts/FollowingPosts.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata('/following/posts', {
        title: await createPageTitleSSR(msg`Following`),
    });
}

export default function Posts() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingPosts />
            </Suspense>
        </NoSSR>
    );
}
