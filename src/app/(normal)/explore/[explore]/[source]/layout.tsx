import { msg } from '@lingui/core/macro';

import { ExploreSourceNav } from '@/components/SourceNav/ExploreSourceNav.js';
import { type ExploreSourceInURL, ExploreType } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/utility.js';

interface Props extends NextPageProps<{ source: ExploreSourceInURL; explore: ExploreType }> {}

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
    await setupLocaleForSSR();

    const { source, explore } = await props.params;

    return (
        <>
            <ExploreSourceNav
                explore={explore}
                source={source}
                className="sticky top-[98px] z-20 bg-primaryBottom md:!top-[103px]"
            />
            {props.children}
        </>
    );
}
