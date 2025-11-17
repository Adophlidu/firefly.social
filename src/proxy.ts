import { NextRequest, NextResponse } from 'next/server.js';

import { handleClubRoutes } from '@/proxy/handlers/clubRoutes.js';
import { handleLegacyRedirects } from '@/proxy/handlers/legacyRedirects.js';
import { handlePostRequests } from '@/proxy/handlers/postRequests.js';
import { handleProfileRoutes } from '@/proxy/handlers/profileRoutes.js';
import { handleTokenRequests } from '@/proxy/handlers/tokenRequests.js';

type ProxyHandler = (request: NextRequest) => NextResponse | undefined;

const handlers: ProxyHandler[] = [
    handleLegacyRedirects,
    handleProfileRoutes,
    handleClubRoutes,
    handlePostRequests,
    handleTokenRequests,
];

export function proxy(request: NextRequest) {
    request.headers.set('X-URL', request.url);

    for (const handler of handlers) {
        const response = handler(request);
        if (response) return response;
    }

    return NextResponse.next({ request });
}

export const config = {
    matcher: [
        '/((?!_next/static|js|sw.js|site.webmanifest|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)',
    ],
};
