import { msg } from '@lingui/core/macro';
import type { ReactNode } from 'react';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export async function generateMetadata() {
    return createSiteMetadata('/community', {
        title: await createPageTitleSSR(msg`Channel`),
    });
}

export default async function DetailLayout({ children }: { children: ReactNode }) {
    await setupLocaleForSSR();
    return <>{children}</>;
}
