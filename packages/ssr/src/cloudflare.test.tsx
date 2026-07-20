import { afterEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import {
    createWorkersHandler,
    getGeo,
    withEdgeCache,
    type WorkersEnv,
} from './cloudflare.ts';
import { buildRouteTree } from './router/tree.ts';
import { SsrDataOutlet } from './runtime/compose.tsx';
import { cacheControlHeader } from './server.ts';
import type { RouteModuleMap } from './runtime/types.ts';

const noopCtx = { waitUntil: (_promise: Promise<unknown>) => {} };

function Root(props: { children?: ReactNode }) {
    return (
        <html>
            <body>
                {props.children}
                <SsrDataOutlet />
            </body>
        </html>
    );
}

function Page() {
    return <p>page</p>;
}

function createEnv(overrides: Partial<WorkersEnv> = {}): WorkersEnv {
    return { ...overrides };
}

describe('createWorkersHandler', () => {
    const tree = buildRouteTree({ files: ['__root.tsx', 'index.tsx', 'api/ping.ts'] });
    const modules: RouteModuleMap = {
        '__root.tsx': { default: Root },
        'index.tsx': {
            default: Page,
            loader: ({ env }) => ({ secret: (env as { SECRET?: string })?.SECRET }),
            config: { cache: { sMaxAge: 300, staleWhileRevalidate: 60 } },
        },
        'api/ping.ts': {
            GET: () => Response.json({ pong: true }),
            config: { cache: { sMaxAge: 30 } },
        },
    };

    it('threads env into loaders and applies route cache config', async () => {
        const handler = createWorkersHandler({ tree, modules });
        const response = await handler(
            new Request('http://localhost/'),
            createEnv({ SECRET: 's3cr3t' }),
            noopCtx,
        );
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('public, s-maxage=300, stale-while-revalidate=60');
        const html = await response.text();
        expect(html).toContain('s3cr3t'); // dehydrated loader data saw env
    });

    it('applies cache config to API responses without overriding explicit headers', async () => {
        const handler = createWorkersHandler({ tree, modules });
        const response = await handler(new Request('http://localhost/api/ping'), createEnv(), noopCtx);
        expect(response.headers.get('cache-control')).toBe('public, s-maxage=30');
    });

    it('serves static assets first and falls back to SSR on asset 404', async () => {
        const assetResponse = new Response('body{}', {
            headers: { 'content-type': 'application/javascript' },
        });
        const handler = createWorkersHandler({ tree, modules });
        const env = createEnv({
            ASSETS: {
                fetch: async (request) =>
                    new URL(request.url).pathname === '/app.js'
                        ? assetResponse
                        : new Response('nope', { status: 404 }),
            },
        });

        const asset = await handler(new Request('http://localhost/app.js'), env, noopCtx);
        expect(await asset.text()).toBe('body{}');

        const fallback = await handler(new Request('http://localhost/'), env, noopCtx);
        expect(fallback.headers.get('content-type')).toContain('text/html');
    });
});

describe('getGeo', () => {
    it('reads request.cf and tolerates its absence', () => {
        const request = new Request('http://localhost/');
        expect(getGeo(request)).toEqual({});

        const cfRequest = Object.assign(request, {
            cf: { country: 'JP', city: 'Tokyo', colo: 'NRT', timezone: 'Asia/Tokyo' },
        });
        expect(getGeo(cfRequest)).toEqual({
            country: 'JP',
            city: 'Tokyo',
            colo: 'NRT',
            timezone: 'Asia/Tokyo',
            region: undefined,
            latitude: undefined,
            longitude: undefined,
        });
    });
});

describe('withEdgeCache', () => {
    afterEach(() => {
        delete (globalThis as { caches?: unknown }).caches;
    });

    it('caches GET 200 responses and serves subsequent hits from the cache', async () => {
        const store = new Map<string, Response>();
        (globalThis as { caches?: unknown }).caches = {
            default: {
                match: async (request: Request) => store.get(request.url),
                put: async (request: Request, response: Response) => {
                    store.set(request.url, response);
                },
            },
        };

        let produced = 0;
        const waits: Promise<unknown>[] = [];
        const ctx = { waitUntil: (promise: Promise<unknown>) => waits.push(promise) };
        const produce = async () => {
            produced += 1;
            return new Response(`render-${produced}`);
        };

        const request = new Request('http://localhost/page');
        const first = await withEdgeCache(request, ctx, { sMaxAge: 60 }, produce);
        expect(await first.text()).toBe('render-1');
        expect(first.headers.get('cache-control')).toBe('public, s-maxage=60');
        await Promise.all(waits);

        const second = await withEdgeCache(request, ctx, { sMaxAge: 60 }, produce);
        expect(second.headers.get('x-ssr-cache')).toBe('hit');
        expect(await second.text()).toBe('render-1');
        expect(produced).toBe(1);
    });

    it('passes through non-GET requests and non-200 responses', async () => {
        (globalThis as { caches?: unknown }).caches = {
            default: {
                match: async () => undefined,
                put: async () => {},
            },
        };
        const posted = await withEdgeCache(
            new Request('http://localhost/', { method: 'POST' }),
            noopCtx,
            { sMaxAge: 60 },
            async () => new Response('posted'),
        );
        expect(await posted.text()).toBe('posted');

        const failed = await withEdgeCache(
            new Request('http://localhost/'),
            noopCtx,
            { sMaxAge: 60 },
            async () => new Response('boom', { status: 500 }),
        );
        expect(failed.status).toBe(500);
    });
});

describe('cacheControlHeader', () => {
    it('renders only the configured directives', () => {
        expect(cacheControlHeader({ sMaxAge: 10 })).toBe('public, s-maxage=10');
        expect(cacheControlHeader({ staleWhileRevalidate: 5 })).toBe(
            'public, stale-while-revalidate=5',
        );
    });
});
