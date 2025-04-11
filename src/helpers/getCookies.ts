import { getEnumAsArray } from '@masknet/kit';
import { cookies } from 'next/headers.js';
import { use } from 'react';

import { Locale, SiteCookies } from '@/constants/enum.js';
import { FIREFLY_DEV_ROOT_URL } from '@/constants/index.js';
import { bom } from '@/helpers/bom.js';
import { defaultLocale } from '@/i18n/index.js';

function resolveLocale(locale: string): Locale {
    return getEnumAsArray(Locale).find(({ value }) => value === locale)?.value ?? defaultLocale;
}

function getClientCookie(name: SiteCookies) {
    const pair = document.cookie.split('; ').find((x) => x.startsWith(`${name}=`));
    if (!pair) return '';
    const [, value] = pair.split('=');
    return value;
}

export async function getCookie(name: SiteCookies) {
    if (bom.document) return getClientCookie(name);
    return (await cookies()).get(name)?.value;
}

export async function getLocaleFromCookies() {
    const locale = await getCookie(SiteCookies.Locale);
    return locale ? resolveLocale(locale) : defaultLocale;
}

export function getIsDevFromCookies() {
    const fireflyRootAPI = getClientCookie(SiteCookies.FireflyRootAPI);
    return fireflyRootAPI === FIREFLY_DEV_ROOT_URL;
}

export function useCookie(key: SiteCookies) {
    if (bom.document) return getClientCookie(key);
    return use(cookies()).get(key)?.value;
}

export function useLocale() {
    const cookie = useCookie(SiteCookies.Locale);
    return resolveLocale(cookie || defaultLocale);
}
