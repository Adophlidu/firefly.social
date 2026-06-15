import { Locale } from '@dimensiondev/enums';
import { msg } from '@lingui/core/macro';

import { NotFoundView } from '@/components/NotFoundView.js';
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

    return <NotFoundView />;
}
