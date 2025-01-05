import { getEnumAsArray } from '@masknet/kit';
import { cookies } from 'next/headers.js';
import { use } from 'react';

import { Locale } from '@/constants/enum.js';
import { bom } from '@/helpers/bom.js';
import { defaultLocale } from '@/i18n/index.js';

function resolveLocale(locale: string): Locale {
    return getEnumAsArray(Locale).find(({ value }) => value === locale)?.value ?? defaultLocale;
}

export function getDOMCookie(field: string) {
    const pair = document.cookie.split('; ').find((x) => x.startsWith(`${field}=`));
    if (!pair) return '';
    const [, value] = pair.split('=');
    return value;
}

export async function getCookieAsync(key: string) {
    if (bom.document) return getDOMCookie(key);
    return (await cookies()).get(key)?.value;
}

export async function getLocaleFromCookiesAsync() {
    const locale = await getCookieAsync('locale');
    return locale ? resolveLocale(locale) : defaultLocale;
}

export function useCookie(key: string) {
    if (bom.document) return getDOMCookie(key);
    return use(cookies()).get(key)?.value;
}

export function useLocale() {
    const cookie = useCookie('locale');
    return resolveLocale(cookie || defaultLocale);
}
