import { msg } from '@lingui/core/macro';

import { FireflyLoginFallback } from '@/app/[locale]/(normal)/profile/pages/FireflyLoginFallback.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata('/profile', {
        title: await createPageTitleSSR(msg`Profile`),
    });
}

export default function Page() {
    return <FireflyLoginFallback />;
}
