import { t } from '@lingui/core/macro';
import { redirect, RedirectType } from 'next/navigation.js';

import { DEFAULT_NOTIFICATION_SOURCE } from '@/constants/index.js';
import { createPageTitleSSR } from '@/helpers/createPageTitle.js';
import { createSiteMetadata } from '@/helpers/createSiteMetadata.js';
import { resolveNotificationUrl } from '@/helpers/resolveNotificationUrl.js';

export async function generateMetadata() {
    return createSiteMetadata({
        title: await createPageTitleSSR(t`Notifications`),
    });
}

export default function Page() {
    redirect(resolveNotificationUrl(DEFAULT_NOTIFICATION_SOURCE), RedirectType.replace);
}
