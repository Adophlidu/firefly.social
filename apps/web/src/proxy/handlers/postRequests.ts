import { type NextRequest, type NextResponse, userAgent } from 'next/server.js';

export function handlePostRequests(request: NextRequest, next: () => NextResponse | undefined) {
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith('/post') && !pathname.includes('/photos')) {
        const { isBot } = userAgent(request);
        request.headers.set('X-IS-BOT', isBot ? 'true' : 'false');
        return next();
    }

    return next();
}
