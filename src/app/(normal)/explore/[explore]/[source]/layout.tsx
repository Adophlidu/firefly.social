import { msg } from '@lingui/core/macro';

import { ExploreSourceNav } from '@/components/SourceNav/ExploreSourceNav.js';
import { type ExploreSourceInURL, ExploreType } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';
import type { NextPageProps } from '@/types/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(msg`Explore`),
    });
}

interface Props extends NextPageProps<{ source: ExploreSourceInURL; explore: ExploreType }> {}

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
