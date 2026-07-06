import { compose } from '@dimensiondev/utils';
import { type NextRequest, NextResponse } from 'next/server.js';

import { hasLocalePrefix } from '@/helpers/stripLocalePathname.js';
import { handleClubRoutes } from '@/proxy/handlers/clubRoutes.js';
import { handleCSP } from '@/proxy/handlers/cspHandler.js';
import { handleLegacyRedirects } from '@/proxy/handlers/legacyRedirects.js';
import {
    addPrefixToRewriteResponse,
    buildPrefixedRewriteUrl,
    resolveLocaleFromRequest,
    setGeoCookies,
} from '@/proxy/handlers/localeRewrite.js';
import { handlePostRequests } from '@/proxy/handlers/postRequests.js';
import { handleProfileRoutes } from '@/proxy/handlers/profileRoutes.js';
import { handleReferralTracking } from '@/proxy/handlers/referralTracking.js';
import { handleTokenRequests } from '@/proxy/handlers/tokenRequests.js';

import proxyRewriteRoutes from '../.next-config/rewrite.config.json' with { type: 'json' };

type ProxyHandler = (request: NextRequest, next: () => NextResponse | undefined) => NextResponse | undefined;
type MiddlewareHandler = (request: NextRequest) => NextResponse | undefined;

const localeRewriteExcludedPaths = [...Object.keys(proxyRewriteRoutes), '/next-debug.log'];
const publicAssetPrefixes = ['/.well-known', '/font', '/image', '/music', '/svg', '/webm'] as const;
const publicAssetExtensionPattern =
    /\.(?:svg|png|jpg|jpeg|gif|webp|js|css|map|ico|xml|txt|ttf|otf|woff|woff2|mp3|mp4|webm|webmanifest)$/;

const handlers = [
    handleCSP,
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

function shouldSkipLocaleRewrite(pathname: string) {
    return localeRewriteExcludedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isPublicAssetPath(pathname: string) {
    return (
        publicAssetPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
        publicAssetExtensionPattern.test(pathname)
    );
}

export default function proxy(request: NextRequest) {
    request.headers.set('X-URL', request.url);
    // Internal-only header (set by handleTokenRequests); never trust an inbound value.
    request.headers.delete('X-SEARCH-PARAMS');

    const { pathname } = request.nextUrl;

    // Skip locale rewrite for external app proxies and already-prefixed locale routes.
    if (shouldSkipLocaleRewrite(pathname) || isPublicAssetPath(pathname) || hasLocalePrefix(pathname)) {
        const response = NextResponse.next({ request });
        setGeoCookies(request, response);
        handleReferralTracking(request, response);
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
        '/((?!_next/static|_next/image|api|js(?:/|$)|font(?:/|$)|image(?:/|$)|music(?:/|$)|svg(?:/|$)|webm(?:/|$)|\\.well-known(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|map|ico|xml|txt|ttf|otf|woff|woff2|mp3|mp4|webm|webmanifest)$).*)',
    ],
    missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
    ],
};
