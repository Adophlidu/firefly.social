import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FollowingPostList } from '@/components/Posts/FollowingPostList.js';
import { Source } from '@/constants/enum.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { msg } from '@lingui/core/macro';

export async function generateMetadata() {
    return createSiteMetadata('/following/posts', {
        title: await createPageTitleSSR(msg`Following`),
    });
}

export default function Posts() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingPostList source={Source.Posts} />
            </Suspense>
        </NoSSR>
    );
}
