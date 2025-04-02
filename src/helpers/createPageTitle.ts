import { SITE_NAME } from '@/constants/index.js';
import { getI18n } from '@/i18n/index.js';

export function createPageTitle(title: string) {
    return `${title} • ${SITE_NAME}`;
}

export async function createPageTitleSSR(
    getMsgId: () => string,
    options?: {
        values?: Record<string, string>;
        withSiteName?: boolean;
    },
) {
    const { t } = await getI18n();
    const title = t(getMsgId(), options?.values);
    const withSiteName = options?.withSiteName ?? true;
    if (!withSiteName) return title;
    return createPageTitle(title);
}

export function createPageTitleOG(title: string) {
    return `${title} in Firefly`;
}
