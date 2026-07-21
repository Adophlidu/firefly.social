import { SITE_NAME } from '@dimensiondev/constants/static';
import { msg } from '@lingui/core/macro';

import { FireflyLoginFallback } from '@/app/[locale]/(normal)/profile/pages/FireflyLoginFallback.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupAndActiveI18n } from '@/i18n/server.js';

export function head({ params }: { params: Record<string, string> }) {
    // Localized title: resolve the catalog directly from the route param —
    // @lingui/react/server's getI18n() only works inside a React server render,
    // not in the library's head() evaluation.
    const i18n = setupAndActiveI18n((params.locale ?? 'en') as never);
    return createSiteMetadata('/profile', {
        title: `${i18n._(msg`Profile`)} • ${SITE_NAME}`,
    });
}

export default function ProfileIndexPage() {
    return <FireflyLoginFallback />;
}
