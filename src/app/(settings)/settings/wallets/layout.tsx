import { msg } from '@lingui/core/macro';

import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(msg`Associated wallets`),
    });
}

export default function WalletsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
