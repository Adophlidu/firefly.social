import { Locale } from '@dimensiondev/enums';
import { type NextRequest, NextResponse } from 'next/server.js';

import { resolveLanguageLocale } from '@/helpers/resolveLocale.js';
import { hasLocalePrefix } from '@/helpers/stripLocalePathname.js';

const SUPPORTED_LOCALES = Object.values(Locale) as string[];

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
