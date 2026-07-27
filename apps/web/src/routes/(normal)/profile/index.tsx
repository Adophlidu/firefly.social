import { SITE_NAME } from '@dimensiondev/constants/static';
import { msg } from '@lingui/core/macro';

import { FireflyLoginFallback } from '@/app/[locale]/(normal)/profile/pages/FireflyLoginFallback.js';
import { fromNextMetadata } from '@/compat/nextMetadata.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveRequestLocale } from '@/helpers/resolveRequestLocale.js';
import { setupAndActiveI18n } from '@/i18n/server.js';
import type { LoaderContext } from '@dimensiondev/ssr';

export function loader({ request }: LoaderContext) {
    return { locale: resolveRequestLocale(request) };
}

export function head({ data }: { data?: { locale?: string } }) {
    // Localized title: resolve the catalog directly — @lingui/react/server's
    // getI18n() only works inside a React server render, not in head().
    const i18n = setupAndActiveI18n((data?.locale ?? 'en') as never);
    return fromNextMetadata(
        createSiteMetadata('/profile', {
            title: `${i18n._(msg`Profile`)} • ${SITE_NAME}`,
        }),
    );
}

export default function ProfileIndexPage() {
    return <FireflyLoginFallback />;
}
