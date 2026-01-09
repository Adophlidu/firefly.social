import { compose } from '@dimensiondev/utils';
import { type NextRequest, NextResponse } from 'next/server.js';

import { handleClubRoutes } from '@/proxy/handlers/clubRoutes.js';
import { handleCSP } from '@/proxy/handlers/cspHandler.js';
import { handleLegacyRedirects } from '@/proxy/handlers/legacyRedirects.js';
import { handlePostRequests } from '@/proxy/handlers/postRequests.js';
import { handleProfileRoutes } from '@/proxy/handlers/profileRoutes.js';
import { handleTokenRequests } from '@/proxy/handlers/tokenRequests.js';

type ProxyHandler = (request: NextRequest, next: () => NextResponse | undefined) => NextResponse | undefined;
type MiddlewareHandler = (request: NextRequest) => NextResponse | undefined;

const handlers = [
    handleCSP, // CSP handler should run first to generate nonce
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

export function proxy(request: NextRequest) {
    request.headers.set('X-URL', request.url);

    const middleware = compose<MiddlewareHandler>(...handlers.map(adaptMiddleware), () =>
        NextResponse.next({ request }),
    );

    return middleware(request);
}

export const config = {
    matcher: [
        '/((?!_next/static|js|sw.js|site.webmanifest|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)',
    ],
};
