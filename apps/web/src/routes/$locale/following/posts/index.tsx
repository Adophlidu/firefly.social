import { SITE_NAME } from '@dimensiondev/constants/static';
import { msg } from '@lingui/core/macro';
import { Suspense } from 'react';

import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FollowingPosts } from '@/components/Posts/FollowingPosts.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupAndActiveI18n } from '@/i18n/server.js';

export function head({ params }: { params: Record<string, string> }) {
    const i18n = setupAndActiveI18n((params.locale ?? 'en') as never);
    return createSiteMetadata('/following/posts', {
        title: `${i18n._(msg`Following`)} • ${SITE_NAME}`,
    });
}

export default function FollowingPostsPage() {
    return (
        <NoSSR>
            <Suspense fallback={<Loading />}>
                <FollowingPosts />
            </Suspense>
        </NoSSR>
    );
}
