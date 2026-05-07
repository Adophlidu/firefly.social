import type { LayoutProps } from '@dimensiondev/types';
import { msg } from '@lingui/core/macro';

import { ExploreType } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

interface Props extends LayoutProps<{ source: string; explore: string }> {}

export async function generateMetadata(props: Props) {
    const { explore, source } = await props.params;
    return createSiteMetadata(`/explore/${explore}/${source}`, {
        title: await createPageTitleSSR(
            explore === ExploreType.TopChannels
                ? msg`Explore - Trending clubs from Farcaster, Lens and Bluesky - Firefly`
                : msg`Explore`,
            {
                withSiteName: explore !== ExploreType.TopChannels,
            },
        ),
    });
}

export default async function Layout(props: Props) {
    return <>{props.children}</>;
}
