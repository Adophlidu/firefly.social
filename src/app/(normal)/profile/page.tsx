import { t } from '@lingui/core/macro';

import { FireflyLoginFallback } from '@/app/(normal)/profile/pages/FireflyLoginFallback.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(() => t`Profile`),
    });
}

export default function Page() {
    return <FireflyLoginFallback />;
}
