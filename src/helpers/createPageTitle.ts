import type { MessageDescriptor } from '@lingui/core';

import { SITE_NAME } from '@/constants/index.js';
import { getLocaleFromCookies } from '@/helpers/getCookies.js';
import { getI18n } from '@/i18n/index.js';

export function createPageTitle(title: string) {
    return `${title} • ${SITE_NAME}`;
}

export async function createPageTitleSSR(
    descriptor: MessageDescriptor,
    options?: {
        withSiteName?: boolean;
    },
) {
    const locale = await getLocaleFromCookies();
    const { t } = getI18n(locale);
    const title = t(descriptor);
    const withSiteName = options?.withSiteName ?? true;
    if (!withSiteName) return title;
    return createPageTitle(title);
}

export function createPageTitleOG(title: string) {
    return `${title} in Firefly`;
}
