// @vitest-environment jsdom

import type { ReactNode } from 'react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hydrateApp } from './client.tsx';
import { buildRouteTree } from './router/tree.ts';
import { SsrDataOutlet } from './runtime/compose.tsx';
import { useLoaderData } from './runtime/context.ts';
import type { RouteModuleMap } from './runtime/types.ts';
import { createServerHandler } from './server.ts';

function Root(props: { children?: ReactNode }) {
    return (
        <div id="app">
            {props.children}
            <SsrDataOutlet />
        </div>
    );
}

function PostPage() {
    const data = useLoaderData<{ id: string; title: string }>();
    return (
        <article>
            post:{data.id} — {data.title}
        </article>
    );
}

let loaderCalls = 0;

const FILES = ['__root.tsx', 'posts/$id.tsx'];
const modules: RouteModuleMap = {
    '__root.tsx': { default: Root },
    'posts/$id.tsx': {
        default: PostPage,
        loader: ({ params }) => {
            loaderCalls += 1;
            return { id: params.id, title: 'hello world' };
        },
        head: ({ data }) => ({ title: `Post ${(data as { id: string }).id}` }),
    },
};

describe('hydrateApp', () => {
    beforeEach(() => {
        loaderCalls = 0;
        (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('hydrates a server-rendered tree from the payload without re-running loaders', async () => {
        const tree = buildRouteTree({ files: FILES });
        const handler = createServerHandler({ tree, modules });
        const response = await handler(new Request('http://localhost/posts/7'));
        const html = (await response.text()).replace('<!DOCTYPE html>', '');
        expect(loaderCalls).toBe(1);

        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.append(container);

        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        await act(async () => {
            await hydrateApp({ tree, modules, root: container, url: 'http://localhost/posts/7' });
        });

        expect(container.querySelector('article')?.textContent).toBe('post:7 — hello world');
        // Loaders ran on the server only; hydration reuses the payload.
        expect(loaderCalls).toBe(1);
        // No hydration mismatch errors. (The "multiple renderers" warning is
        // a dev-only artifact of running Fizz and the client renderer in one
        // process, which never happens in production.)
        const hydrationErrors = consoleError.mock.calls.filter((call) =>
            call.some((arg) => String(arg).includes('Hydration failed')),
        );
        expect(hydrationErrors).toEqual([]);
    });

    it('throws when the payload script is missing', async () => {
        const tree = buildRouteTree({ files: FILES });
        await expect(hydrateApp({ tree, modules })).rejects.toThrow(/missing #__SSR_DATA__/);
    });
});
