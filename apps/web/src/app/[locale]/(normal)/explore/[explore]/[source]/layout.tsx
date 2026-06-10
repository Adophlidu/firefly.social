import { ExploreType } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { msg } from '@lingui/core/macro';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

interface Props extends LayoutProps<{ source: string; explore: string }> {}

function resolveExplorePageTitle(explore: string) {
    if (explore === ExploreType.TopChannels) {
        return msg`Explore - Trending clubs from Farcaster, Lens and Bluesky - Firefly`;
    }

    if (explore === ExploreType.Prediction) {
        return msg`Prediction`;
    }

    return msg`Explore`;
}

export async function generateMetadata(props: Props) {
    const { explore, source } = await props.params;
    return createSiteMetadata(`/explore/${explore}/${source}`, {
        title: await createPageTitleSSR(resolveExplorePageTitle(explore), {
            withSiteName: explore !== ExploreType.TopChannels,
        }),
    });
}

export default async function Layout(props: Props) {
    return <>{props.children}</>;
}
