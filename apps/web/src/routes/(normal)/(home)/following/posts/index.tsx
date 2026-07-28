import { SITE_NAME } from '@dimensiondev/constants/static';
import type { LoaderContext } from '@dimensiondev/ssr';
import { msg } from '@lingui/core/macro';
import { Suspense } from 'react';

import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { Loading } from '@/components/Loading.js';
import { NoSSR } from '@/components/NoSSR.js';
import { FollowingPosts } from '@/components/Posts/FollowingPosts.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveRequestLocale } from '@/helpers/resolveRequestLocale.js';
import { setupAndActiveI18n } from '@/i18n/server.js';

export function loader({ request }: LoaderContext) {
    return { locale: resolveRequestLocale(request) };
}

export function head({ data }: { data?: { locale?: string } }) {
    const i18n = setupAndActiveI18n((data?.locale ?? 'en') as never);
    return fromNextMetadata(
        createSiteMetadata('/following/posts', {
            title: `${i18n._(msg`Following`)} • ${SITE_NAME}`,
        }),
    );
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
