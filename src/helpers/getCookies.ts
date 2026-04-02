import { bom } from '@dimensiondev/utils';
import { useLingui } from '@lingui/react';
import { cookies, headers } from 'next/headers.js';

import { Locale, SiteCookies } from '@/constants/enum.js';
import { isValidEnumValue } from '@/helpers/isValidEnumValue.js';

export function resolveLocale(locale: string): Locale {
    return isValidEnumValue(locale, Locale) ? (locale as Locale) : resolveLanguageLocale(bom.navigator?.language);
}

function getClientCookies(name: SiteCookies) {
    const pair = bom.document?.cookie.split('; ').find((x) => x.startsWith(`${name}=`));
    if (!pair) return '';
    const [, value] = pair.split('=');
    return value;
}

export async function getCookie(name: SiteCookies) {
    if (bom.document) return getClientCookies(name);
    return (await cookies()).get(name)?.value;
}

export function resolveLanguageLocale(language: string | undefined) {
    if (!language) return Locale.en;
    if (language.startsWith('en')) return Locale.en;
    if (language.startsWith('zh'))
        return ['zh', 'zh-CN', 'zh-SG'].includes(language) || language.startsWith('zh-Hans')
            ? Locale.zhHans
            : Locale.zhHant;
    return Locale.en;
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

export function useCookie(key: SiteCookies) {
    if (bom.document) return getClientCookies(key);
    // During SSR of client components, return empty.
    // The real value is read client-side after hydration.
    return '';
}

export function useLocale() {
    // Use Lingui's active locale for SSR/client consistency (avoids hydration mismatch).
    const { i18n } = useLingui();
    // Read cookie unconditionally to satisfy React hooks rules (no conditional hook calls)
    const localeFromCookie = useCookie(SiteCookies.Locale);

    if (i18n?.locale && isValidEnumValue(i18n.locale, Locale)) {
        return i18n.locale as Locale;
    }

    // Fallback: read from cookie (client-only)
    const locale = localeFromCookie || resolveLanguageLocale(bom.navigator?.language);
    return resolveLocale(locale);
}
