import { msg } from '@lingui/core/macro';

import { DEFAULT_BOOKMARK_SOURCE } from '@/constants/computed.js';
import { redirect, RedirectType } from '@/esm/navigation/server.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveBookmarkUrl } from '@/helpers/resolveBookmarkUrl.js';

export async function generateMetadata() {
    return createSiteMetadata('/bookmarks', {
        title: await createPageTitleSSR(msg`Bookmarks`),
    });
}

export default async function Page() {
    redirect(resolveBookmarkUrl(DEFAULT_BOOKMARK_SOURCE), RedirectType.replace);
}
