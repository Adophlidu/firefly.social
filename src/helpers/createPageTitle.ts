import { type MessageDescriptor } from '@lingui/core';

import { SITE_NAME } from '@/constants/static.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

function createPageTitle(title: string) {
    return `${title} • ${SITE_NAME}`;
}

export async function createPageTitleSSR(
    descriptor: MessageDescriptor,
    options?: {
        withSiteName?: boolean;
    },
) {
    const i18n = await setupLocaleForSSR();
    const title = i18n._(descriptor);
    const withSiteName = options?.withSiteName ?? true;
    if (!withSiteName) return title;
    return createPageTitle(title);
}
