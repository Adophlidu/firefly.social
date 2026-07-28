/**
 * Minimal fetch-native replacement for the parts of `next/server` this repo
 * still references (NextRequest type annotations, NextResponse.json/redirect).
 * The real Next.js server runtime is gone; API routes in the SSR app receive
 * standard Request objects and return standard Responses.
 */
export class NextRequest extends Request {
    /** Compatibility accessor mirroring Next.js (`request.nextUrl`). */
    get nextUrl(): URL {
        return new URL(this.url);
    }
}

type NextResponseInit = ResponseInit & {
    url?: string;
};

export class NextResponse extends Response {
    static override json(data: unknown, init?: ResponseInit): NextResponse {
        const headers = new Headers(init?.headers);
        if (!headers.has('content-type')) headers.set('content-type', 'application/json');
        return new NextResponse(JSON.stringify(data), { ...init, headers });
    }

    static override redirect(url: string | URL, statusOrInit: number | NextResponseInit = 307): NextResponse {
        const init = typeof statusOrInit === 'number' ? { status: statusOrInit } : statusOrInit;
        const headers = new Headers(init.headers);
        headers.set('location', String(url));
        return new NextResponse(null, { ...init, headers });
    }
}

export type { NextResponseInit };
