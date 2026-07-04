import { ExploreType } from '@dimensiondev/enums';
import type { LayoutProps } from '@dimensiondev/types';
import { msg } from '@lingui/core/macro';

import { getExploreChannelsPageData } from '@/app/[locale]/(normal)/explore/[explore]/[source]/getExploreChannelsPageData.js';
import { ExploreChannelsProvider } from '@/components/Explores/ExploreChannelsContext.js';
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
    const { explore, source } = await props.params;

    // Only TopChannels is server-rendered. Other [source] types (CryptoTrends, Prediction,
    // TopProfiles) keep their original client-only rendering — pre-rendering them here exposed
    // item-level hydration mismatches (token row attributes, prediction countdowns). Returning
    // children untouched preserves their exact prior behaviour; SSR them once those item
    // components are hydration-safe.
    if (explore !== ExploreType.TopChannels) return <>{props.children}</>;

    const initialChannelsPage = await getExploreChannelsPageData(source);

    return (
        <ExploreChannelsProvider initialChannelsPage={initialChannelsPage}>{props.children}</ExploreChannelsProvider>
    );
}
