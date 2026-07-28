import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { buildRouteTree } from './router/tree.ts';
import { SsrDataOutlet } from './runtime/compose.tsx';
import { notFound, redirect } from './runtime/errors.ts';
import type { RouteModuleMap } from './runtime/types.ts';
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
    return <p>page-content</p>;
}

function CustomNotFound() {
    return <p>custom-404</p>;
}

function CustomError({ error }: { error: Error }) {
    return <p>custom-500:{error.message}</p>;
}

const FILES = ['__root.tsx', '_layout.tsx', 'gone.tsx', 'boom.tsx', 'leave.tsx', 'silent.tsx'];

function handlerWith(modules: RouteModuleMap) {
    return createServerHandler({
        tree: buildRouteTree({ files: FILES }),
        modules: { '__root.tsx': { default: Root }, ...modules },
    });
}

describe('server error paths', () => {
    it('loader redirect(): 302 + Location for HTML, redirect field for data requests', async () => {
        const handler = handlerWith({
            'leave.tsx': { default: Page, loader: () => redirect('/target') },
        });

        const html = await handler(new Request('http://localhost/leave'));
        expect(html.status).toBe(302);
        expect(html.headers.get('location')).toBe('/target');

        const data = await handler(new Request('http://localhost/leave', { headers: { 'x-ssr-data': 'true' } }));
        expect(await data.json()).toMatchObject({ redirect: '/target' });
    });

    it('loader notFound(): renders nearest notFoundComponent with 404', async () => {
        const handler = handlerWith({
            '_layout.tsx': { notFoundComponent: CustomNotFound },
            'gone.tsx': { default: Page, loader: () => notFound() },
        });

        const response = await handler(new Request('http://localhost/gone'));
        expect(response.status).toBe(404);
        const html = await response.text();
        expect(html).toContain('custom-404');
        expect(html).not.toContain('page-content');

        const data = await handler(new Request('http://localhost/gone', { headers: { 'x-ssr-data': 'true' } }));
        expect(await data.json()).toMatchObject({ notFound: true });
    });

    it('loader notFound() without boundary falls back to plain 404', async () => {
        const handler = handlerWith({
            'gone.tsx': { default: Page, loader: () => notFound() },
        });
        const response = await handler(new Request('http://localhost/gone'));
        expect(response.status).toBe(404);
        expect(await response.text()).toBe('Not Found');
    });

    it('loader error: renders nearest errorComponent with 500 and the message', async () => {
        const handler = handlerWith({
            '_layout.tsx': { errorComponent: CustomError },
            'boom.tsx': {
                default: Page,
                loader: () => {
                    throw new Error('kaput');
                },
            },
        });

        const response = await handler(new Request('http://localhost/boom'));
        expect(response.status).toBe(500);
        const html = await response.text();
        expect(html).toContain('custom-500:');
        expect(html).toContain('kaput');

        const data = await handler(new Request('http://localhost/boom', { headers: { 'x-ssr-data': 'true' } }));
        expect(await data.json()).toMatchObject({ error: 'kaput' });
    });

    it('loader error without boundary propagates', async () => {
        const handler = handlerWith({
            'boom.tsx': {
                default: Page,
                loader: () => {
                    throw new Error('kaput');
                },
            },
        });
        await expect(handler(new Request('http://localhost/boom'))).rejects.toThrow('kaput');
    });

    it('redirects and errors do not leak cache headers from route config', async () => {
        const handler = handlerWith({
            '_layout.tsx': { errorComponent: CustomError },
            'boom.tsx': {
                default: Page,
                config: { cache: { sMaxAge: 300 } },
                loader: () => {
                    throw new Error('kaput');
                },
            },
        });
        const response = await handler(new Request('http://localhost/boom'));
        expect(response.headers.get('cache-control')).toBeNull();
    });
});
