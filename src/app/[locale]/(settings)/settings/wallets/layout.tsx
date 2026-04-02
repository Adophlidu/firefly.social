import { msg } from '@lingui/core/macro';
import { type ReactNode } from 'react';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata('/settings/wallets', {
        title: await createPageTitleSSR(msg`Associated wallets`),
    });
}

export default function Layout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
