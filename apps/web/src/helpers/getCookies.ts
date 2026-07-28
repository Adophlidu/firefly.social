import { SiteCookies } from '@dimensiondev/enums';
import { bom } from '@dimensiondev/utils';

import { resolveLanguageLocale, resolveLocale } from '@/helpers/resolveLocale.js';

export function getClientCookies(name: SiteCookies) {
    const pair = bom.document?.cookie.split('; ').find((x) => x.startsWith(`${name}=`));
    if (!pair) return '';
    const [, value] = pair.split('=');
    return value;
}

export function getLocaleFromCookies() {
    const locale = getClientCookies(SiteCookies.Locale);
    return locale ? resolveLocale(locale) : resolveLanguageLocale(bom.navigator?.language);
}

export function getLocalFromClientCookies() {
    const locale = getClientCookies(SiteCookies.Locale);
    return locale ? resolveLocale(locale) : resolveLanguageLocale(bom.navigator?.language);
}
