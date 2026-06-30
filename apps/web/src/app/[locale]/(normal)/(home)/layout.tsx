import { msg } from '@lingui/core/macro';
import type { PropsWithChildren } from 'react';

import { HomeTabs } from '@/components/HomeTab/index.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata('/', {
        title: await createPageTitleSSR(msg`Home`),
    });
}

export default async function Layout({ children }: PropsWithChildren) {
    // No NoSSR wrapper here: HomeTabs renders fine on the server, and each child page
    // (discover/following · posts/activities/prediction) owns its own NoSSR boundary,
    // so the discover posts page can opt into SSR without forcing it on the others.
    return (
        <div className="flex w-full flex-col">
            <HomeTabs />
            {children}
        </div>
    );
}
