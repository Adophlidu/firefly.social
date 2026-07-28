import type { MiddlewareFn } from '@dimensiondev/ssr';

import rewriteRoutes from '../../.next-config/rewrite.config.json' with { type: 'json' };

type Env = 'staging' | 'canary' | 'production';

const ENV: Env = (process.env.NEXT_PUBLIC_DEPLOY_ENV as Env) || 'production';

const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'host',
    'content-length',
]);

/** Prefixes served by satellite apps (also excluded from locale rewrite). */
export const EXTERNAL_REWRITE_PREFIXES = Object.keys(rewriteRoutes);

function targetUrl(request: Request, prefix: string, base: string): URL {
    const url = new URL(request.url);
    const remainder = url.pathname.slice(prefix.length);
    const joined = base.endsWith('/') ? base + remainder.replace(/^\//, '') : base + (remainder || '');
    return new URL(joined + url.search);
}

function proxyRequest(request: Request, targetBase: string, prefix: string): Promise<Response> {
    const target = targetUrl(request, prefix, targetBase);

    const headers = new Headers();
    for (const [key, value] of request.headers.entries()) {
        if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) headers.set(key, value);
    }
    // The satellite apps on Vercel sit behind deployment protection.
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypassSecret) headers.set('x-vercel-protection-bypass', bypassSecret);

    return fetch(target, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        // @ts-expect-error Node/Workers requires duplex for streamed bodies
        duplex: 'half',
    }).then((upstream) => {
        const responseHeaders = new Headers();
        upstream.headers.forEach((value, key) => {
            if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) responseHeaders.set(key, value);
        });
        return new Response(upstream.body, {
            status: upstream.status,
            headers: responseHeaders,
        });
    });
}

/**
 * Reverse proxy for the satellite apps (wallet iframe, chat, about, sitemap,
 * …), replacing Next's external rewrites (.next-config/rewrite.config.json).
 * Preserves same-origin semantics for the wallet iframe.
 */
export const externalRewrites: MiddlewareFn = (request, { next }) => {
    const { pathname } = new URL(request.url);
    const entry = Object.entries(rewriteRoutes).find(([prefix]) => pathname.startsWith(prefix));
    if (!entry) return next();

    const [prefix, targets] = entry as [string, Record<Env, string>];
    return proxyRequest(request, targets[ENV], prefix);
};
