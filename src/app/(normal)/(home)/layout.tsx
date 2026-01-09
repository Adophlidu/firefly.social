import { msg } from '@lingui/core/macro';
import { type PropsWithChildren } from 'react';

import { HomeTabs } from '@/components/HomeTab/index.js';
import { NoSSR } from '@/components/NoSSR.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export async function generateMetadata() {
    return createSiteMetadata('/', {
        title: await createPageTitleSSR(msg`Home`),
    });
}

export default async function Layout({ children }: PropsWithChildren) {
    await setupLocaleForSSR();

    return (
        <div className="flex w-full flex-col">
            <NoSSR>
                <HomeTabs />
                {children}
            </NoSSR>
        </div>
    );
}
