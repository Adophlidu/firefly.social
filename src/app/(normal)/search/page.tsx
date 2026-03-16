import { msg } from '@lingui/core/macro';

import { type SearchType } from '@/constants/enum.js';
import { redirect } from '@/esm/navigation/server.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import { type LayoutProps } from '@/types/utility.js';

interface Props extends LayoutProps<{}, { type: SearchType; q: string }> {}

export async function generateMetadata(props: Props) {
    const searchParams = await props.searchParams;
    return createSiteMetadata(`/search?${new URLSearchParams(searchParams).toString()}`, {
        title: await createPageTitleSSR(msg`Search`),
    });
}

export default async function Page(props: Props) {
    const searchParams = await props.searchParams;
    redirect(resolveSearchUrl(searchParams.q, searchParams.type));
}
