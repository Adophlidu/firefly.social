import { Trans } from '@lingui/react/macro';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PageDetail } from '@/app/(normal)/post/[source]/[id]/(detail)/client.js';
import LoadingPage from '@/app/(normal)/post/[source]/[id]/(detail)/loading.js';
import { getPostDetailQuery, getPostThreadQuery } from '@/app/(normal)/post/[source]/[id]/(detail)/query.js';
import { Comeback } from '@/components/Comeback.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { queryClientConfig } from '@/configs/queryClient.js';
import { type SocialSourceInURL } from '@/constants/enum.js';
import { notFound } from '@/esm/navigation/server.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isRequestedLoginSource } from '@/helpers/isRequestedLoginSource.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import { createPostMetadata } from '@/providers/firefly/metadata/createPostMetadata.js';
import type { NextPageProps } from '@/types/utility.js';

export const revalidate = 60;

interface Props extends NextPageProps<{ id: string; source: SocialSourceInURL }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { source, id } = await props.params;
    return isSocialSourceInUrl(source)
        ? createPostMetadata(source, id, `/post/${source}/${id}`)
        : createSiteMetadata(`/post/${source}/${id}`);
}

export default async function Page(props: Props) {
    await setupLocaleForSSR();

    const params = await props.params;
    if (!isSocialSourceInUrl(params.source)) notFound();

    const source = resolveSocialSource(params.source);

    const queryClient = new QueryClient(queryClientConfig);
    const post = await queryClient.ensureQueryData(getPostDetailQuery(source, params.id));
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
    }
    await queryClient.prefetchQuery(getPostThreadQuery(source, params.id, post));

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<LoadingPage />}>
                <PageDetail id={params.id} source={source} />
            </Suspense>
        </HydrationBoundary>
    );
}
