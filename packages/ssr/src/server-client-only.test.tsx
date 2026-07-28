import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { buildRouteTree } from './router/tree.ts';
import { SsrDataOutlet } from './runtime/compose.tsx';
import { useLoaderData } from './runtime/context.ts';
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

function Shell() {
    return <p>app-shell</p>;
}

function HeavyPage() {
    const data = useLoaderData<{ expensive: string }>();
    return <main>heavy:{data.expensive}</main>;
}

let heavyModuleEvaluated = false;

const FILES = ['__root.tsx', '_layout.tsx', 'index.tsx', 'heavy.tsx'];

function createHandler() {
    heavyModuleEvaluated = false;
    return createServerHandler({
        tree: buildRouteTree({
            files: FILES,
            clientOnly: (file) => file === 'heavy.tsx',
        }),
        modules: {
            '__root.tsx': { default: Root, pendingComponent: Shell },
            '_layout.tsx': {
                default: (props: { children?: ReactNode }) => <div id="layout">{props.children}</div>,
            },
            'index.tsx': { default: () => <h1>home</h1> },
            'heavy.tsx': new Proxy(
                {
                    default: HeavyPage,
                    loader: () => ({ expensive: 'server-loaded-data' }),
                },
                {
                    get(target, prop) {
                        heavyModuleEvaluated = true;
                        return Reflect.get(target, prop);
                    },
                },
            ),
        },
    });
}

describe('client-only routes', () => {
    it('renders the pending shell without evaluating the page module', async () => {
        const handler = createHandler();
        const response = await handler(new Request('http://localhost/heavy'));
        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html).toContain('app-shell');
        expect(html).toContain('id="layout"');
        expect(html).not.toContain('server-loaded-data');
        expect(heavyModuleEvaluated).toBe(false);
    });

    it('renders normal pages untouched by the clientOnly marking', async () => {
        const handler = createHandler();
        const response = await handler(new Request('http://localhost/'));
        expect(await response.text()).toContain('<h1>home</h1>');
    });

    it('runs loaders for data requests against the same route', async () => {
        const handler = createHandler();
        const response = await handler(new Request('http://localhost/heavy', { headers: { 'x-ssr-data': 'true' } }));
        expect(await response.json()).toMatchObject({
            url: '/heavy',
            data: { 'heavy.tsx': { expensive: 'server-loaded-data' } },
        });
        expect(heavyModuleEvaluated).toBe(true);
    });

    it('marks the payload as pending for the client hand-off', async () => {
        const handler = createHandler();
        const response = await handler(new Request('http://localhost/heavy'));
        const html = await response.text();
        expect(html).toContain('"pending":true');
    });
});
