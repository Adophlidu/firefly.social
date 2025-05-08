import { Trans } from '@lingui/react/macro';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';

import { PostDetailPage } from '@/app/(normal)/post/[source]/[id]/pages/DetailPage.js';
import { Comeback } from '@/components/Comeback.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { KeyType, type SocialSourceInURL } from '@/constants/enum.js';
import { EMPTY_LIST } from '@/constants/index.js';
import { notFound } from '@/esm/navigation/server.js';
import { createMetadataPostById } from '@/helpers/createMetadataPostById.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { runInSafeAsync } from '@/helpers/runInSafe.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { getPostById } from '@/services/getPostById.js';
import { getThreads } from '@/services/getThreads.js';
import type { NextPageProps } from '@/types/index.js';

export const revalidate = 60;

const createPageMetadata = memoizeWithRedis(createMetadataPostById, {
    key: KeyType.CreateMetadataPostById,
});

interface Props extends NextPageProps<{ id: string; source: SocialSourceInURL }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;

    if (isSocialSourceInUrl(params.source)) {
        return createPageMetadata(params.source, params.id);
    }
    return createSiteMetadata();
}

export default async function Page(props: Props) {
    await setupLocaleForSSR();

    const params = await props.params;
    if (!isSocialSourceInUrl(params.source)) notFound();

    const source = resolveSocialSource(params.source);

    const queryClient = new QueryClient();
    const post = await getPostById(source, params.id);

    if (!post) {
        if (isRequestedLoginSource(source)) {
            return (
                <article className="min-h-screen">
                    <header className="sticky top-0 z-40 flex items-center bg-primaryBottom px-4 py-[18px]">
                        <Comeback className="mr-8" />
                        <h2 className="text-xl font-black leading-6">
                            <Trans>Sign in to unlock</Trans>
                        </h2>
                    </header>
                    <NotLoginFallback source={source} />
                </article>
            );
        }
        notFound();
    }
    const threadResult = await runInSafeAsync(() => getThreads(post, source));
    const threads = threadResult?.data || EMPTY_LIST;
    await queryClient.setQueryData([source, 'post-detail', params.id], post);
    await queryClient.setQueryData([source, 'post-thread', params.id], threads);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <PostDetailPage id={params.id} source={source} />
        </HydrationBoundary>
    );
}
