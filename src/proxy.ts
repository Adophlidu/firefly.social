import { compose } from '@dimensiondev/utils';
import { type NextRequest, NextResponse } from 'next/server.js';

import { handleClubRoutes } from '@/proxy/handlers/clubRoutes.js';
import { handleCSP } from '@/proxy/handlers/cspHandler.js';
import { handleLegacyRedirects } from '@/proxy/handlers/legacyRedirects.js';
import {
    addPrefixToRewriteResponse,
    buildPrefixedRewriteUrl,
    hasLocalePrefix,
    resolveLocaleFromRequest,
    setGeoCookies,
} from '@/proxy/handlers/localeRewrite.js';
import { handlePostRequests } from '@/proxy/handlers/postRequests.js';
import { handleProfileRoutes } from '@/proxy/handlers/profileRoutes.js';
import { handleTokenRequests } from '@/proxy/handlers/tokenRequests.js';

type ProxyHandler = (request: NextRequest, next: () => NextResponse | undefined) => NextResponse | undefined;
type MiddlewareHandler = (request: NextRequest) => NextResponse | undefined;

const handlers = [
    handleCSP, // CSP handler wraps the chain to add Report-Only header
    handleLegacyRedirects,
    handleProfileRoutes,
    handleClubRoutes,
    handlePostRequests,
    handleTokenRequests,
] satisfies ProxyHandler[];

function adaptMiddleware(handler: ProxyHandler) {
    return (next: MiddlewareHandler): MiddlewareHandler => {
        return (request: NextRequest) => handler(request, () => next(request));
    };
}

export default function proxy(request: NextRequest) {
    request.headers.set('X-URL', request.url);

    const { pathname } = request.nextUrl;

    // Skip rewrite if path already has /{locale}/ prefix, but still set geo cookies
    if (hasLocalePrefix(pathname)) {
        const response = NextResponse.next({ request });
        setGeoCookies(request, response);
        return response;
    }

    // Resolve locale for rewrite
    const locale = resolveLocaleFromRequest(request);
    const localeCookie = request.cookies.get('locale')?.value;

    const middleware = compose<MiddlewareHandler>(
        ...handlers.map(adaptMiddleware),
        // Terminal: rewrite to /{locale}/... path
        () => {
            const url = buildPrefixedRewriteUrl(request, locale);
            return NextResponse.rewrite(url, { request });
        },
    );

    let response = middleware(request);

    if (response) {
        // If a handler produced a rewrite (not the terminal), add locale prefix to it
        response = addPrefixToRewriteResponse(response, request, locale);

        // Set geo cookies from Vercel headers
        setGeoCookies(request, response);

        // Set locale cookie if not present
        if (!localeCookie) {
            response.cookies.set('locale', locale, {
                path: '/',
                httpOnly: false,
                sameSite: 'lax',
            });
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|js|sw.js|site.webmanifest|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)',
    ],
};
