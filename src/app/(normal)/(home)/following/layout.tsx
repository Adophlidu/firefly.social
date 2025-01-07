import { t } from '@lingui/core/macro';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import type { NextPageProps } from '@/types/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(t`Following`),
    });
}

interface Props extends NextPageProps {}

export default async function Layout(props: Props) {
    return props.children;
}
