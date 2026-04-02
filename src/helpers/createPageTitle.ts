import { type MessageDescriptor } from '@lingui/core';
import { getI18n } from '@lingui/react/server';

import { SITE_NAME } from '@/constants/static.js';

function createPageTitle(title: string) {
    return `${title} • ${SITE_NAME}`;
}

export async function createPageTitleSSR(
    descriptor: MessageDescriptor,
    options?: {
        withSiteName?: boolean;
    },
) {
    const existing = getI18n();

    if (existing) {
        const title = existing._(descriptor);
        const withSiteName = options?.withSiteName ?? true;
        return withSiteName ? createPageTitle(title) : title;
    }

    // Fallback: if i18n not yet initialized (e.g., generateMetadata race), set up from cookies
    const { setupLocaleForSSR } = await import('@/i18n/index.js');
    const i18n = await setupLocaleForSSR();
    const title = i18n._(descriptor);
    const withSiteName = options?.withSiteName ?? true;
    return withSiteName ? createPageTitle(title) : title;
}
