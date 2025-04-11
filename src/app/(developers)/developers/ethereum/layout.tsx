import { t } from '@lingui/core/macro';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(() => t`Ethereum JSON RPC`),
    });
}

export default async function DetailLayout({ children }: { children: React.ReactNode }) {
    await setupLocaleForSSR();
    return <>{children}</>;
}
