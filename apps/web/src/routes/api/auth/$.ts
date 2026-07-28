import type { ApiContext } from '@dimensiondev/ssr';
import urlcat from 'urlcat';

import { authOptions } from '@/app/api/auth/[...nextauth]/options.js';
import { DeleteCookieScript, MaskDelegateCookieName } from '@/app/api/mask/delegate-x-token/shared.js';
import { Auth } from '@/esm/Auth.js';

/**
 * next-auth v4 ships two entry paths (see `next-auth/next/index.js`):
 * - the App Router path requires `next/headers` request scope — Next.js only,
 *   unusable on Cloudflare Workers;
 * - the Pages Router path (`NextAuthApiHandler`) only needs a Node-flavored
 *   `{ method, headers, cookies, query, body }` request and a
 *   `{ status, getHeader, setHeader, json, send, end }` response.
 * We call the public `NextAuth(options)` handler with lightweight shims for
 * those two shapes and convert the captured output to a standard `Response`.
 * Cookie writing goes through plain `Set-Cookie` headers.
 */

type NodeishRequest = {
    method: string;
    headers: Record<string, string>;
    cookies: Record<string, string>;
    query: Record<string, string | string[]>;
    body?: Record<string, unknown>;
};

/** Captures the NextApiResponse-style calls made by `NextAuthApiHandler`. */
class NodeishResponse {
    statusCode = 200;
    private body: string | null = null;
    private headers = new Map<string, string | string[]>();

    status(code: number) {
        this.statusCode = code;
        return this;
    }

    getHeader(name: string) {
        return this.headers.get(name.toLowerCase());
    }

    setHeader(name: string, value: string | string[]) {
        this.headers.set(name.toLowerCase(), value);
        return this;
    }

    json(payload: unknown) {
        this.setHeader('Content-Type', 'application/json');
        this.body = JSON.stringify(payload);
    }

    send(payload: unknown) {
        this.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    }

    end() {
        this.body ??= null;
    }

    toResponse(): Response {
        const headers = new Headers();
        for (const [name, value] of this.headers) {
            if (Array.isArray(value)) {
                for (const entry of value) headers.append(name, entry);
            } else {
                headers.set(name, value);
            }
        }
        return new Response(this.body, { status: this.statusCode, headers });
    }
}

const nextAuthHandler = Auth(authOptions) as (req: NodeishRequest, res: NodeishResponse) => Promise<void>;

function parseCookies(header: string | null): Record<string, string> {
    if (!header) return {};
    const cookies: Record<string, string> = {};
    for (const pair of header.split(';')) {
        const index = pair.indexOf('=');
        if (index < 0) continue;
        const name = pair.slice(0, index).trim();
        if (!name) continue;
        const raw = pair.slice(index + 1).trim();
        try {
            cookies[name] = decodeURIComponent(raw);
        } catch {
            cookies[name] = raw;
        }
    }
    return cookies;
}

async function parseBody(request: Request): Promise<Record<string, unknown> | undefined> {
    if (request.method !== 'POST') return undefined;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        return (await request.json()) as Record<string, unknown>;
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
        return Object.fromEntries(new URLSearchParams(await request.text()));
    }
    return undefined;
}

async function forwardToNextAuth(request: Request, segments: string[]): Promise<Response> {
    const url = new URL(request.url);
    const req: NodeishRequest = {
        method: request.method,
        headers: Object.fromEntries(request.headers),
        cookies: parseCookies(request.headers.get('cookie')),
        query: { ...Object.fromEntries(url.searchParams), nextauth: segments },
        body: await parseBody(request),
    };
    const res = new NodeishResponse();
    await nextAuthHandler(req, res);
    return res.toResponse();
}

export async function GET({ params, request, url }: ApiContext) {
    // Mirrors the two GET special cases of the legacy
    // `app/api/auth/[...nextauth]/route.ts`.
    if (url.pathname === '/api/auth/signin') {
        return Response.redirect(
            new URL(urlcat('/auth/error', { error: url.searchParams.get('error') }), url.origin),
            307,
        );
    }

    if (
        url.pathname === '/api/auth/callback/twitter' &&
        parseCookies(request.headers.get('cookie'))[MaskDelegateCookieName]
    ) {
        return new Response(
            `<!doctype html><a id="c" href="#">It's now safe to turn off this page.</a><script>${DeleteCookieScript};c.onclose=()=>window.close()</script>`,
            {
                headers: {
                    'Content-Type': 'text/html, charset=utf-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    // mirrors `cookies().delete({ name, path })`
                    'Set-Cookie': `${MaskDelegateCookieName}=; path=/api/auth/callback/twitter; expires=${new Date(0).toUTCString()}`,
                },
            },
        );
    }

    return forwardToNextAuth(request, (params['*'] ?? '').split('/').filter(Boolean));
}

export function POST({ params, request }: ApiContext) {
    return forwardToNextAuth(request, (params['*'] ?? '').split('/').filter(Boolean));
}
