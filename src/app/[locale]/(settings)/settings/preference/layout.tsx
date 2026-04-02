import { msg } from '@lingui/core/macro';
import { type ReactNode } from 'react';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata('/settings/preference', {
        title: await createPageTitleSSR(msg`Content preference`),
    });
}

export default async function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
