import { NextRequest, NextResponse } from 'next/server.js';

export function handleTokenRequests(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/token/')) {
        if (request.nextUrl.searchParams.size > 0) {
            request.headers.set('X-SEARCH-PARAMS', request.nextUrl.searchParams.toString());
            return NextResponse.next({ request });
        }
    }

    return;
}
