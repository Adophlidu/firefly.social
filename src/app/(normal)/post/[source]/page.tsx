import { type Metadata } from 'next';

import { type SocialSourceInURL } from '@/constants/enum.js';
import { notFound, redirect } from '@/esm/navigation/server.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { isSocialSourceInUrl } from '@/helpers/isSource.js';
import { resolvePostUrl } from '@/helpers/resolvePostUrl.js';
import { resolveSocialSource } from '@/helpers/resolveSource.js';
import { createPostMetadata } from '@/providers/firefly/metadata/createPostMetadata.js';
import { type NextPageProps } from '@/types/utility.js';

export const revalidate = 60;

interface Props extends NextPageProps<{ source: SocialSourceInURL }, { source: SocialSourceInURL }> {}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const params = await props.params;
    const pathname = `/post/${params.source}?${new URLSearchParams(searchParams).toString()}`;
    return isSocialSourceInUrl(searchParams.source)
        ? createPostMetadata(searchParams.source, params.source, pathname)
        : createSiteMetadata(pathname);
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
