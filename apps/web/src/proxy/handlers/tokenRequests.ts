import type { NextRequest, NextResponse } from 'next/server.js';

export function handleTokenRequests(request: NextRequest, next: () => NextResponse | undefined) {
    if (request.nextUrl.pathname.startsWith('/token/')) {
        if (request.nextUrl.searchParams.size > 0) {
            request.headers.set('X-SEARCH-PARAMS', request.nextUrl.searchParams.toString());
            return next();
        }
    }

    return next();
}
