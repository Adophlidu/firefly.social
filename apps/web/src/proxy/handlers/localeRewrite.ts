import { Locale } from '@dimensiondev/enums';
import { type NextRequest, NextResponse } from 'next/server.js';

import { resolveLanguageLocale } from '@/helpers/resolveLocale.js';

const SUPPORTED_LOCALES = Object.values(Locale) as string[];

/**
 * Check if pathname already starts with /{locale}/ prefix.
 */
export function hasLocalePrefix(pathname: string): boolean {
    const parts = pathname.split('/');
    if (parts.length < 2) return false;
    return SUPPORTED_LOCALES.includes(parts[1]);
}

/**
 * Resolve locale from cookie → Accept-Language → default 'en'.
 */
export function resolveLocaleFromRequest(request: NextRequest): string {
    const localeCookie = request.cookies.get('locale')?.value;
    if (localeCookie && SUPPORTED_LOCALES.includes(localeCookie)) {
        return localeCookie;
    }

    const acceptLanguage = request.headers.get('Accept-Language')?.split(',')[0];
    return resolveLanguageLocale(acceptLanguage);
}

/**
 * Copy Vercel geo headers to cookies so client components can read them.
 */
export function setGeoCookies(request: NextRequest, response: NextResponse): void {
    const geoHeaders: Array<[string, string]> = [
        ['x-vercel-ip-timezone', '__ff_geo_tz'],
        ['x-vercel-ip-city', '__ff_geo_city'],
        ['x-vercel-ip-country', '__ff_geo_country'],
        ['x-vercel-ip-country-region', '__ff_geo_region'],
    ];

    for (const [header, cookie] of geoHeaders) {
        // Only set if not already present — avoid Set-Cookie on every response
        // which prevents Vercel CDN from caching ISR pages
        if (request.cookies.get(cookie)) continue;
        const value = request.headers.get(header);
        if (value) {
            response.cookies.set(cookie, value, {
                path: '/',
                httpOnly: false,
                sameSite: 'lax',
            });
        }
    }
}

/**
 * Build the rewrite URL with locale prefix.
 */
export function buildPrefixedRewriteUrl(request: NextRequest, locale: string): URL {
    const url = request.nextUrl.clone();
    const { pathname } = url;
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return url;
}

/**
 * Add locale prefix to an existing rewrite URL in the response.
 */
export function addPrefixToRewriteResponse(response: NextResponse, request: NextRequest, locale: string): NextResponse {
    const rewriteUrl = response.headers.get('x-middleware-rewrite');
    if (!rewriteUrl) return response;

    const parsed = new URL(rewriteUrl);
    if (hasLocalePrefix(parsed.pathname)) return response;

    parsed.pathname = `/${locale}${parsed.pathname}`;

    const newResponse = NextResponse.rewrite(parsed, { request });

    for (const cookie of response.cookies.getAll()) {
        newResponse.cookies.set(cookie);
    }

    for (const [key, value] of response.headers.entries()) {
        if (key !== 'x-middleware-rewrite' && !key.startsWith('set-cookie')) {
            newResponse.headers.set(key, value);
        }
    }

    return newResponse;
}
