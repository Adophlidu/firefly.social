import { getEnumAsArray } from '@masknet/kit';
import { cookies } from 'next/headers.js';
import { use } from 'react';

import { Locale, SiteCookies } from '@/constants/enum.js';
import { DEFAULT_LOCALE } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';

function resolveLocale(locale: string): Locale {
    return getEnumAsArray(Locale).find(({ value }) => value === locale)?.value ?? DEFAULT_LOCALE;
}

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

export async function getLocaleFromCookies() {
    const locale = await getCookie(SiteCookies.Locale);
    return locale ? resolveLocale(locale) : DEFAULT_LOCALE;
}

export function getLocalFromClientCookies() {
    const locale = getClientCookies(SiteCookies.Locale);
    return locale ? resolveLocale(locale) : DEFAULT_LOCALE;
}

export function useCookie(key: SiteCookies) {
    if (bom.document) return getClientCookies(key);
    return use(cookies()).get(key)?.value ?? '';
}

export function useLocale() {
    const cookie = useCookie(SiteCookies.Locale);
    return resolveLocale(cookie || DEFAULT_LOCALE);
}
