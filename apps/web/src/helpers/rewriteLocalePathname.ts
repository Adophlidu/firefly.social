import { Locale } from '@dimensiondev/enums';
import { bom } from '@dimensiondev/utils';

import { hasLocalePrefix } from '@/helpers/stripLocalePathname.js';
import { resolveLanguageLocale } from '@/helpers/resolveLocale.js';

const SUPPORTED_LOCALES = Object.values(Locale) as string[];

const LOCALE_EXCLUDED_PREFIXES = [
    '/api',
    '/i',
    '/.well-known',
    '/font',
    '/image',
    '/music',
    '/svg',
    '/webm',
    '/assets',
    '/js',
    '/wallet-iframe',
    '/perp-kline-chart',
    '/chat',
    '/about',
    '/sitemap',
];

const STATIC_FILE_PATTERN = /\.(?:svg|png|jpg|jpeg|gif|webp|js|css|map|ico|xml|txt|ttf|otf|woff|woff2|mp3|mp4|webm|webmanifest|json)$/;

function resolveClientLocale(): string {
    const cookie = bom.document?.cookie.match(/(?:^|;\s*)locale=([^;]*)/)?.[1];
    if (cookie && SUPPORTED_LOCALES.includes(decodeURIComponent(cookie))) {
        return decodeURIComponent(cookie);
    }
    return resolveLanguageLocale(bom.navigator?.language);
}

/**
 * Client-side counterpart of the locale middleware rewrite: prefix
 * non-prefixed page paths with the resolved locale (`/posts` → `/en/posts`).
 * Used by hydrateApp's rewritePathname so the client router matches the same
 * URLs the server rewrote.
 */
export function rewriteLocalePathname(pathname: string): string {
    if (hasLocalePrefix(pathname)) return pathname;
    if (LOCALE_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return pathname;
    if (STATIC_FILE_PATTERN.test(pathname)) return pathname;
    return `/${resolveClientLocale()}${pathname === '/' ? '' : pathname}`;
}
