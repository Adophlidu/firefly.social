import { Trans } from '@lingui/react/macro';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation.js';
import type React from 'react';

import { PostDetailPage } from '@/app/(normal)/post/[source]/[id]/pages/DetailPage.js';
import { Comeback } from '@/components/Comeback.js';
import { NoSSR } from '@/components/NoSSR.js';
import { NotLoginFallback } from '@/components/NotLoginFallback.js';
import { KeyType, type SocialSourceInURL, Source } from '@/constants/enum.js';
import { REQUIRE_LOGIN_SOURCES } from '@/constants/index.js';
import { createMetadataPostById } from '@/helpers/createMetadataPostById.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isBotRequest } from '@/helpers/isBotRequest.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolveSessionHolder } from '@/helpers/resolveSessionHolder.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { setupTwitterSessionForSSR } from '@/helpers/setupTwitterSessionForSSR.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
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
    if (await isBotRequest()) return null;

    await setupLocaleForSSR();
    await setupTwitterSessionForSSR();

    const params = await props.params;
    if (!isSocialSourceInUrl(params.source)) notFound();

    const source = resolveSocialSource(params.source);
    if (REQUIRE_LOGIN_SOURCES.includes(source) && !resolveSessionHolder(source).session) {
        return (
            <article className="min-h-screen">
                <header className="sticky top-0 z-40 flex items-center border-b border-line bg-primaryBottom px-4 py-[18px]">
                    <Comeback className="mr-8" />
                    <h2 className="text-xl font-black leading-6">
                        <Trans>Details</Trans>
                    </h2>
                </header>
                <NotLoginFallback source={source} />
            </article>
        );
    }

    if (source === Source.Twitter) {
        return (
            <NoSSR>
                <PostDetailPage id={params.id} source={source} />
            </NoSSR>
        );
    }

    return <PostDetailPage id={params.id} source={source} />;
}
