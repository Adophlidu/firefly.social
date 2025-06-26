import { msg } from '@lingui/core/macro';
import { type ReactNode } from 'react';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata('/developers/post-link', {
        title: await createPageTitleSSR(msg`Post Link Validator`),
    });
}

export default async function DetailLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
