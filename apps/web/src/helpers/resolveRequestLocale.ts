import { Locale, SiteCookies } from '@dimensiondev/enums';

import { resolveLanguageLocale } from '@/helpers/resolveLocale.js';

const LOCALES = Object.values(Locale) as string[];

/** Resolve the viewer's locale from a request: locale cookie → Accept-Language → 'en'. */
export function resolveRequestLocale(request: Request): Locale {
    const cookie = request.headers.get('cookie') ?? '';
    const localeCookie = cookie.match(new RegExp(`(?:^|;\\s*)${SiteCookies.Locale}=([^;]*)`))?.[1];
    if (localeCookie) {
        const value = decodeURIComponent(localeCookie);
        if (LOCALES.includes(value)) return value as Locale;
    }
    const acceptLanguage = request.headers.get('accept-language')?.split(',')[0];
    return resolveLanguageLocale(acceptLanguage);
}

