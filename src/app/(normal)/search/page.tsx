import { t } from '@lingui/core/macro';
import { redirect } from 'next/navigation.js';

import type { SearchType } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveSearchUrl } from '@/helpers/resolveSearchUrl.js';
import type { NextPageProps } from '@/types/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(() => t`Search`),
    });
}

interface Props extends NextPageProps<{}, { type: SearchType; q: string }> {}

export default async function Page(props: Props) {
    const searchParams = await props.searchParams;
    redirect(resolveSearchUrl(searchParams.q, searchParams.type));
}
