import { SITE_NAME } from '@/constants/index.js';
import { setupLocaleForSSR } from '@/i18n/index.js';

export function createPageTitle(title: string) {
    return `${title} • ${SITE_NAME}`;
}

export async function createPageTitleSSR(msgId: () => string) {
    await setupLocaleForSSR();
    const msg = msgId();
    return createPageTitle(msg);
}

export function createPageTitleOG(title: string) {
    return `${title} in Firefly`;
}
