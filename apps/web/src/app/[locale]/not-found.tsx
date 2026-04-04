import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { BaseNotFound } from '@/components/BaseNotFound.js';
import { Link } from '@/components/Link.js';
import { Locale, PageRoute } from '@/constants/enum.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleFromParams } from '@/i18n/static.js';

export async function generateMetadata() {
    setupLocaleFromParams(Locale.en);
    return createSiteMetadata('/not-found', {
        title: await createPageTitleSSR(msg`Page not found`),
    });
}

export default function NotFound() {
    setupLocaleFromParams(Locale.en);

    return (
        <BaseNotFound className="min-h-screen grow md:pl-[235px] lg:pl-[289px]">
            <div className="mt-11 text-sm font-bold">
                <Trans>The page could not be found.</Trans>
            </div>
            <Link className="text-link underline md:hidden" href={PageRoute.Home}>
                <Trans>Back to home</Trans>
            </Link>
        </BaseNotFound>
    );
}
