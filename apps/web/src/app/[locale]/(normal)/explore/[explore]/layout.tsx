import type { LayoutProps } from '@dimensiondev/types';
import { msg } from '@lingui/core/macro';

import { ExploreType } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export function generateStaticParams() {
    return Object.values(ExploreType).map((explore) => ({ explore }));
}

interface Props extends LayoutProps<{ explore: string }> {}

export async function generateMetadata(props: Props) {
    const { explore } = await props.params;

    return createSiteMetadata(`/explore/${explore}`, {
        title: await createPageTitleSSR(msg`Explore`),
    });
}

export default async function Layout(props: Props) {
    return <>{props.children}</>;
}
