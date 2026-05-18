import { Source } from '@dimensiondev/enums';
import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { DiscoverPostList } from '@/components/Posts/DiscoverPostList.js';

import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export const metadata = createSiteMetadata('/posts');

export default function Posts() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <DiscoverPostList source={Source.Posts} />
            </Suspense>
        </NoSSR>
    );
}
