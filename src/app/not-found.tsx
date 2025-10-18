import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { BaseNotFound } from '@/components/BaseNotFound.js';
import { IfPathname } from '@/components/IfPathname.js';
import { Link } from '@/components/Link.js';
import { LinkCloud } from '@/components/LinkCloud.js';
import { AsideSearchBar } from '@/components/Search/SearchBar.js';
import { SuggestedChannels } from '@/components/SuggestedChannels/SuggestedChannels.js';
import { SuggestedFollows } from '@/components/SuggestedFollows/SuggestedFollows.js';
import { PageRoute } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export async function generateMetadata() {
    return createSiteMetadata('/not-found', {
        title: await createPageTitleSSR(msg`Page not found`),
    });
}

export default async function NotFound() {
    await setupLocaleForSSR();

    return (
        <>
            <BaseNotFound className="min-h-screen grow md:pl-[235px] lg:pl-[289px]">
                <div className="mt-11 text-sm font-bold">
                    <Trans>The page could not be found.</Trans>
                </div>
                <Link className="text-link underline md:hidden" href={PageRoute.Home}>
                    <Trans>Back to home</Trans>
                </Link>
            </BaseNotFound>
            <aside className="sticky top-0 z-1 hidden h-screen w-96 flex-col gap-4 px-4 md:min-w-[384px] lg:flex">
                <IfPathname isNotOneOf={[PageRoute.Settings]}>
                    <AsideSearchBar />
                </IfPathname>
                <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-auto">
                    <IfPathname isNotOneOf={[PageRoute.Home]} exact>
                        <SuggestedFollows />
                        <SuggestedChannels />
                    </IfPathname>
                    <LinkCloud />
                </div>
            </aside>
        </>
    );
}
