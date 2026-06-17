import { Locale, SiteCookies } from '@dimensiondev/enums';
import { bom } from '@dimensiondev/utils';
import { cookies, headers } from 'next/headers.js';

import { resolveLanguageLocale, resolveLocale } from '@/helpers/resolveLocale.js';

export function getClientCookies(name: SiteCookies) {
    const pair = bom.document?.cookie.split('; ').find((x) => x.startsWith(`${name}=`));
    if (!pair) return '';
    const [, value] = pair.split('=');
    return value;
}

export async function getCookie(name: SiteCookies) {
    if (bom.document) return getClientCookies(name);
    return (await cookies()).get(name)?.value;
}

async function resolveClientLocale() {
    if (bom.document) return resolveLanguageLocale(bom.navigator?.language);
    const acceptLanguageHeader = (await headers()).get('Accept-Language');
    const headerLang = acceptLanguageHeader?.split(',')[0];
    return headerLang ? resolveLanguageLocale(headerLang) : Locale.en;
}

export async function getLocaleFromCookies() {
    const locale = await getCookie(SiteCookies.Locale);
    return locale ? resolveLocale(locale) : resolveClientLocale();
}

export function getLocalFromClientCookies() {
    const locale = getClientCookies(SiteCookies.Locale);
    return locale ? resolveLocale(locale) : resolveLanguageLocale(bom.navigator?.language);
}
