import { getI18n } from '@lingui/react/server';

import { getLocaleFromCookies, getLocalFromClientCookies } from '@/helpers/getCookies.js';
import { setupAndActiveI18n } from '@/i18n/core.js';

export { getI18nInstance, setupAndActiveI18n, supportedLocales } from '@/i18n/core.js';

export async function setupLocaleForSSR() {
    const instance = getI18n();
    if (instance) return instance;

    const locale = await getLocaleFromCookies();
    const i18n = setupAndActiveI18n(locale);
    return i18n;
}

/**
 * set locale and dynamically import catalog
 * @param locale a supported locale string
 */
export function setupLocalForClient() {
    const locale = getLocalFromClientCookies();
    const i18n = setupAndActiveI18n(locale);
    return i18n;
}
