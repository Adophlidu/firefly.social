import { t } from '@lingui/core/macro';

import { Source } from '@/constants/enum.js';
import { redirect } from '@/esm/navigation.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveProfileUrl } from '@/helpers/resolveProfileUrl.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(() => t`Profile`),
    });
}

export default function Page() {
    redirect(resolveProfileUrl(Source.Farcaster));
}
