import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { buildRouteTree } from './router/tree.ts';
import { HeadOutlet, SsrDataOutlet } from './runtime/compose.tsx';
import { useLoaderData } from './runtime/context.ts';
import type { RouteModuleMap } from './runtime/types.ts';
import { createServerHandler } from './server.ts';

function Root(props: { children?: ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadOutlet />
            </head>
            <body>
                {props.children}
                <SsrDataOutlet />
            </body>
        </html>
    );
}

function Layout(props: { children?: ReactNode }) {
    return <div id="layout">{props.children}</div>;
}

function HomePage() {
    const data = useLoaderData<{ message: string }>();
    return <h1>{data.message}</h1>;
}

function PostPage() {
    const data = useLoaderData<{ id: string }>();
    return <article>post:{data.id}</article>;
}

const FILES = ['__root.tsx', '_layout.tsx', 'index.tsx', 'posts/$id.tsx'];

function createHandler(modules: RouteModuleMap = {}) {
    return createServerHandler({
        tree: buildRouteTree({ files: FILES }),
        modules: {
            '__root.tsx': { default: Root },
            '_layout.tsx': { default: Layout },
            'index.tsx': {
                default: HomePage,
                loader: () => ({ message: 'hello from loader' }),
                head: () => ({ title: 'Home', meta: [{ name: 'description', content: 'home page' }] }),
            },
            'posts/$id.tsx': {
                default: PostPage,
                loader: ({ params }) => ({ id: params.id }),
                head: ({ data }) => ({ title: `Post ${(data as { id: string }).id}` }),
            },
            ...modules,
        },
    });
}

describe('createServerHandler', () => {
    it('streams a full document with loader data, head tags and the payload script', async () => {
        const handler = createHandler();
        const response = await handler(new Request('http://localhost/'));
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/html');

        const html = await response.text();
        expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
        expect(html).toContain('<h1>hello from loader</h1>');
        expect(html).toContain('<title>Home</title>');
        expect(html).toContain('<meta data-ssr-managed="" name="description" content="home page"/>');
        expect(html).toContain('id="__SSR_DATA__"');
        expect(html).toContain('hello from loader'); // dehydrated data present
    });

    it('passes route params to loaders and composes nested layouts', async () => {
        const handler = createHandler();
        const response = await handler(new Request('http://localhost/posts/abc-123'));
        const html = await response.text();
        expect(html).toContain('post:');
        expect(html).toContain('abc-123');
        expect(html).toContain('<title>Post abc-123</title>');
        expect(html).toContain('id="layout"');
    });

    it('escapes user data inside the dehydration payload', async () => {
        const handler = createHandler({
            'index.tsx': {
                default: HomePage,
                loader: () => ({ message: '</script><script>alert(1)</script>' }),
            },
        });
        const response = await handler(new Request('http://localhost/'));
        const html = await response.text();
        const payloadMarkup = html.slice(html.indexOf('id="__SSR_DATA__"'));
        expect(payloadMarkup).not.toContain('</script><script>alert(1)</script>');
    });

    it('returns 404 for unmatched paths', async () => {
        const handler = createHandler();
        const response = await handler(new Request('http://localhost/nope'));
        expect(response.status).toBe(404);
    });
    it('strips basepath before matching and serves the data endpoint under it', async () => {
        const handler = createServerHandler({
            tree: buildRouteTree({ files: FILES }),
            modules: {
                '__root.tsx': { default: Root },
                '_layout.tsx': { default: Layout },
                'index.tsx': { default: HomePage, loader: () => ({ message: 'based' }) },
                'posts/$id.tsx': { default: PostPage, loader: ({ params }) => ({ id: params.id }) },
            },
            basepath: '/wallet-iframe',
        });

        const page = await handler(new Request('http://localhost/wallet-iframe/posts/9'));
        expect(page.status).toBe(200);
        const html = await page.text();
        expect(html).toContain('post:');
        expect(html).toContain('9');

        const data = await handler(
            new Request('http://localhost/wallet-iframe/posts/9', {
                headers: { 'x-ssr-data': 'true' },
            }),
        );
        expect(await data.json()).toMatchObject({
            url: '/posts/9',
            params: { id: '9' },
            data: { 'posts/$id.tsx': { id: '9' } },
        });
    });
});
