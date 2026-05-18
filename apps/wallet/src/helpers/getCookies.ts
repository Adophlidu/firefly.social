import { Locale, SiteCookies } from '@dimensiondev/enums';
import { bom, isValidEnumValue } from '@dimensiondev/utils';

export function resolveLocale(locale: string): Locale {
    return isValidEnumValue(locale, Locale) ? (locale as Locale) : resolveLanguageLocale(bom.navigator?.language);
}

export function getClientCookies(name: SiteCookies) {
    const pair = bom.document?.cookie.split('; ').find((x) => x.startsWith(`${name}=`));
    if (!pair) return '';
    const [, value] = pair.split('=');
    return value;
}

export async function getCookie(name: SiteCookies) {
    // In TanStack Start, cookies are only accessible client-side via document.cookie
    // For server-side, cookies should be passed through route loaders
    return getClientCookies(name);
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

export async function resolveClientLocale() {
    // In client environment, use navigator.language
    return resolveLanguageLocale(bom.navigator?.language);
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
    return getClientCookies(key);
}

export function useLocale() {
    const localeFromCookie = useCookie(SiteCookies.Locale);
    const locale = localeFromCookie || resolveLanguageLocale(bom.navigator?.language);
    return resolveLocale(locale);
}
