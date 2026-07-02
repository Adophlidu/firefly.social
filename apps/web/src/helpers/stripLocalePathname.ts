import { Locale } from '@dimensiondev/enums';

const LOCALES = Object.values(Locale) as string[];

/**
 * Check if pathname starts with a /{locale} segment.
 */
export function hasLocalePrefix(pathname: string): boolean {
    const parts = pathname.split('/');
    if (parts.length < 2) return false;
    return LOCALES.includes(parts[1]);
}

/**
 * Remove a leading locale segment (e.g. /en/signup -> /signup) so route
 * matching behaves the same for locale-prefixed and bare pathnames.
 */
export function stripLocalePathname(pathname: string) {
    if (!hasLocalePrefix(pathname)) return pathname;
    return pathname.replace(/^\/[^/]+/, '') || '/';
}
