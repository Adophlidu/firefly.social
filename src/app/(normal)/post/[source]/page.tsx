import type { Metadata } from 'next';

import { KeyType, type SocialSourceInURL } from '@/constants/enum.js';
import { notFound, redirect } from '@/esm/navigation/server.js';
import { createMetadataPostById } from '@/helpers/createMetadataPostById.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { memoizeWithRedis } from '@/helpers/memoizeWithRedis.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import type { NextPageProps } from '@/types/utility.js';

export const revalidate = 60;

const createPageMetadata = memoizeWithRedis(createMetadataPostById, {
    key: KeyType.CreateMetadataPostById,
});

interface Props extends NextPageProps<{ source: SocialSourceInURL }, { source: SocialSourceInURL }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const params = await props.params;
    const pathname = `/post/${params.source}?${new URLSearchParams(searchParams).toString()}`;
    if (isSocialSourceInUrl(searchParams.source))
        return createPageMetadata(pathname, searchParams.source, params.source);
    return createSiteMetadata(pathname);
}

export default async function Page(props: Props) {
    const searchParams = await props.searchParams;
    const params = await props.params;
    if (!searchParams.source) notFound();
    if (!isSocialSourceInUrl(params.source)) {
        redirect(resolvePostUrl(resolveSocialSource(searchParams.source), params.source));
    }
    notFound();
}
