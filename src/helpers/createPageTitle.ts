import { SITE_NAME } from '@/constants/index.js';
import { getI18n } from '@/i18n/index.js';

export function createPageTitle(title: string) {
    return `${title} • ${SITE_NAME}`;
}

export async function createPageTitleSSR(getMsgId: () => string) {
    const { t } = await getI18n();
    return createPageTitle(t(getMsgId()));
}

export function createPageTitleOG(title: string) {
    return `${title} in Firefly`;
}
