import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { buildRouteTree } from './router/tree.ts';
import { SsrDataOutlet } from './runtime/compose.tsx';
import type { MiddlewareFn } from './server.ts';
import { createServerHandler } from './server.ts';

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
    return <h1>page</h1>;
}

const tree = buildRouteTree({ files: ['__root.tsx', 'index.tsx', 'about.tsx'] });
const modules = {
    '__root.tsx': { default: Root },
    'index.tsx': { default: Page },
    'about.tsx': { default: Page },
};

describe('middleware', () => {
    it('short-circuits with a response', async () => {
        const handler = createServerHandler({
            tree,
            modules,
            middleware: [() => new Response('blocked', { status: 403 })],
        });
        const response = await handler(new Request('http://localhost/'));
        expect(response.status).toBe(403);
        expect(await response.text()).toBe('blocked');
    });

    it('continues to routing when returning undefined', async () => {
        const calls: string[] = [];
        const tracker: MiddlewareFn = (request) => {
            calls.push(new URL(request.url).pathname);
        };
        const handler = createServerHandler({ tree, modules, middleware: [tracker] });
        const response = await handler(new Request('http://localhost/about'));
        expect(response.status).toBe(200);
        expect(calls).toEqual(['/about']);
    });

    it('rewrites the request via next()', async () => {
        const rewrite: MiddlewareFn = (request, { next }) => {
            const url = new URL(request.url);
            if (url.pathname === '/old') {
                return next(new Request('http://localhost/about', request));
            }
            return undefined;
        };
        const handler = createServerHandler({ tree, modules, middleware: [rewrite] });
        const response = await handler(new Request('http://localhost/old'));
        expect(response.status).toBe(200);
        expect(await response.text()).toContain('<h1>page</h1>');
    });

    it('runs the chain in order', async () => {
        const order: number[] = [];
        const make =
            (index: number): MiddlewareFn =>
            () => {
                order.push(index);
            };
        const handler = createServerHandler({ tree, modules, middleware: [make(1), make(2), make(3)] });
        await handler(new Request('http://localhost/'));
        expect(order).toEqual([1, 2, 3]);
    });

    it('can decorate the downstream response', async () => {
        const decorator: MiddlewareFn = async (request, { next }) => {
            const response = await next();
            response.headers.set('x-mw', 'yes');
            return response;
        };
        const handler = createServerHandler({ tree, modules, middleware: [decorator] });
        const response = await handler(new Request('http://localhost/'));
        expect(response.headers.get('x-mw')).toBe('yes');
    });
});
