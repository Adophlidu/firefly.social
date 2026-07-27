// @vitest-environment jsdom

import { act } from 'react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hydrateApp } from './client.tsx';
import { buildRouteTree } from './router/tree.ts';
import { HeadOutlet, Link, SsrDataOutlet, useLoaderData, useNavigate, useRouterState } from './index.ts';
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

// Variant exercising head updates on navigation (React owns <head> tags
// via <HeadOutlet>; two mounted head-rendering roots would fight over
// document.head, so only the title test uses it).
function HeadfulRoot(props: { children?: ReactNode }) {
    return (
        <div id="app">
            <HeadOutlet />
            {props.children}
            <SsrDataOutlet />
        </div>
    );
}

function HomePage() {
    return (
        <main>
            <h1>home</h1>
            <Link href="/about">go about</Link>
        </main>
    );
}

function ReplaceHomePage() {
    const navigate = useNavigate();
    return (
        <main>
            <h1>home</h1>
            <button type="button" onClick={() => navigate('/about', { replace: true })}>
                replace about
            </button>
        </main>
    );
}

function AboutPage() {
    const data = useLoaderData<{ message: string }>();
    return <main>about:{data.message}</main>;
}

const FILES = ['__root.tsx', 'index.tsx', 'about.tsx'];
const modules: RouteModuleMap = {
    '__root.tsx': { default: Root },
    'index.tsx': { default: HomePage, loader: () => ({ message: 'home' }) },
    'about.tsx': {
        default: AboutPage,
        loader: () => ({ message: 'loaded-on-server' }),
        head: () => ({ title: 'About' }),
    },
};

const tree = buildRouteTree({ files: FILES });

async function renderInto(path: string): Promise<HTMLElement> {
    const handler = createServerHandler({ tree, modules });
    const response = await handler(new Request(`http://localhost${path}`));
    const html = (await response.text()).replace('<!DOCTYPE html>', '');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    return container;
}

describe('client-side navigation', () => {
    const mountedRoots: Array<{ unmount: () => void }> = [];
    beforeEach(() => {
        (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
        window.history.replaceState(null, '', '/');
        document.head.innerHTML = '';
    });

    afterEach(() => {
        // Unmount every hydrated root: React 19 hoists head tags into the
        // shared document.head, and a root left mounted across tests fights
        // the next one over those nodes (removeChild on null).
        for (const root of mountedRoots.splice(0)) {
            act(() => root.unmount());
        }
        document.body.innerHTML = '';
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('navigates on Link click: fetches payload, swaps content, pushes history, applies head', async () => {
        const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
            expect((init?.headers as Record<string, string>)['x-ssr-data']).toBe('true');
            return Response.json({
                url: '/about',
                params: {},
                data: { 'about.tsx': { message: 'loaded-on-server' } },
                heads: [{ title: 'About' }],
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const headfulTree = buildRouteTree({ files: FILES });
        const headfulModules: RouteModuleMap = { ...modules, '__root.tsx': { default: HeadfulRoot } };
        const container = await renderInto('/');
        await act(async () => {
            mountedRoots.push(
                await hydrateApp({ tree: headfulTree, modules: headfulModules, root: container, url: 'http://localhost/' }),
            );
        });
        expect(container.querySelector('h1')?.textContent).toBe('home');

        const anchor = container.querySelector('a');
        expect(anchor).not.toBeNull();
        await act(async () => {
            anchor!.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(container.querySelector('main')?.textContent).toBe('about:loaded-on-server');
        expect(window.location.pathname).toBe('/about');
        expect(document.title).toBe('About');
    });

    it('lets modified clicks and external targets fall through to the browser', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const container = await renderInto('/');
        await act(async () => {
            mountedRoots.push(await hydrateApp({ tree, modules, root: container, url: 'http://localhost/' }));
        });

        const anchor = container.querySelector('a')!;
        await act(async () => {
            anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0, metaKey: true }));
        });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(window.location.pathname).toBe('/');
    });

    it('navigates back via popstate using a replace (no extra history entry)', async () => {
        const payloads: Record<string, object> = {
            '/about': {
                url: '/about',
                params: {},
                data: { 'about.tsx': { message: 'loaded-on-server' } },
                heads: [],
            },
            '/': { url: '/', params: {}, data: { 'index.tsx': { message: 'home' } }, heads: [] },
        };
        vi.stubGlobal(
            'fetch',
            vi.fn(async (input: RequestInfo | URL) => Response.json(payloads[String(input)])),
        );

        const container = await renderInto('/');
        await act(async () => {
            mountedRoots.push(await hydrateApp({ tree, modules, root: container, url: 'http://localhost/' }));
        });

        await act(async () => {
            container.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
        });
        expect(container.querySelector('main')?.textContent).toContain('about:');

        // Simulate the browser back button: the URL already changed; the
        // router catches up via popstate without pushing a new entry.
        window.history.replaceState(null, '', '/');
        await act(async () => {
            window.dispatchEvent(new PopStateEvent('popstate'));
        });
        expect(container.querySelector('h1')?.textContent).toBe('home');
    });

    it('follows redirect payloads from loaders as another navigation', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const path = String(input);
            if (path === '/about') {
                // The /about loader redirects back home.
                return Response.json({ url: '/about', params: {}, data: {}, heads: [], redirect: '/' });
            }
            return Response.json({
                url: '/',
                params: {},
                data: { 'index.tsx': { message: 'home' } },
                heads: [],
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const container = await renderInto('/');
        await act(async () => {
            mountedRoots.push(await hydrateApp({ tree, modules, root: container, url: 'http://localhost/' }));
        });

        await act(async () => {
            container.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
        });

        // Clicked /about → payload said redirect:/ → followed to home.
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(container.querySelector('h1')?.textContent).toBe('home');
        expect(window.location.pathname).toBe('/');
    });

    it('shows the pendingComponent during slow navigations, then resolves', async () => {
        let resolveFetch: ((response: Response) => void) | null = null;
        vi.stubGlobal(
            'fetch',
            vi.fn(
                async () =>
                    new Promise<Response>((resolve) => {
                        resolveFetch = resolve;
                    }),
            ),
        );

        const pendingModules: RouteModuleMap = {
            ...modules,
            'about.tsx': {
                ...modules['about.tsx'],
                pendingComponent: () => <p>loading-about</p>,
            },
        };

        const container = await renderInto('/');
        await act(async () => {
            mountedRoots.push(
                await hydrateApp({
                    tree,
                    modules: pendingModules,
                    root: container,
                    url: 'http://localhost/',
                    pendingMs: 10,
                }),
            );
        });

        // Start a navigation whose payload never arrives immediately.
        await act(async () => {
            container.querySelector('a')!.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
            await new Promise((resolve) => setTimeout(resolve, 50));
        });
        expect(container.querySelector('p')?.textContent).toBe('loading-about');

        await act(async () => {
            resolveFetch!(
                Response.json({
                    url: '/about',
                    params: {},
                    data: { 'about.tsx': { message: 'loaded-on-server' } },
                    heads: [],
                }),
            );
        });
        expect(container.querySelector('main')?.textContent).toBe('about:loaded-on-server');
    });

    it('exposes navigationType=replace for replace navigations', async () => {
        let observedType: string | undefined;
        function Probe() {
            const state = useRouterState();
            observedType = state.navigationType;
            return null;
        }
        function ReplaceRoot(props: { children?: ReactNode }) {
            return (
                <div id="app">
                    <Probe />
                    {props.children}
                    <SsrDataOutlet />
                </div>
            );
        }
        const probeModules: RouteModuleMap = {
            ...modules,
            '__root.tsx': { default: ReplaceRoot },
            'index.tsx': { default: ReplaceHomePage, loader: () => ({ message: 'home' }) },
        };
        vi.stubGlobal(
            'fetch',
            vi.fn(async () =>
                Response.json({
                    url: '/about',
                    params: {},
                    data: { 'about.tsx': { message: 'loaded-on-server' } },
                    heads: [],
                }),
            ),
        );

        const tree = buildRouteTree({ files: FILES });
        const handler = createServerHandler({ tree, modules: probeModules });
        const response = await handler(new Request('http://localhost/'));
        const html = (await response.text()).replace('<!DOCTYPE html>', '');
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.append(container);

        await act(async () => {
            mountedRoots.push(await hydrateApp({ tree, modules: probeModules, root: container, url: 'http://localhost/' }));
        });
        expect(observedType).toBeUndefined();

        await act(async () => {
            container.querySelector('button')!.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
        });
        expect(observedType).toBe('replace');
    });

    it('runs client-only loaders in the browser and merges their data', async () => {
        const coFiles = ['__root.tsx', 'index.tsx', 'co.tsx'];
        const coTree = buildRouteTree({ files: coFiles, clientOnly: (file) => file === 'co.tsx' });
        const coModules: RouteModuleMap = {
            '__root.tsx': { default: Root },
            'index.tsx': {
                default: function CoHomePage() {
                    return (
                        <main>
                            <h1>home</h1>
                            <Link href="/co">go co</Link>
                        </main>
                    );
                },
                loader: () => ({ message: 'home' }),
            },
            'co.tsx': {
                default: function CoPage() {
                    const data = useLoaderData<{ message: string }>();
                    return <main>co:{data.message}</main>;
                },
                loader: () => ({ message: 'loaded-on-client' }),
            },
        };
        // The server payload can only carry non-clientOnly data.
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => Response.json({ url: '/co', params: {}, data: {}, heads: [] })),
        );

        const tree = coTree;
        const handler = createServerHandler({ tree, modules: coModules });
        const response = await handler(new Request('http://localhost/'));
        const html = (await response.text()).replace('<!DOCTYPE html>', '');
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.append(container);

        await act(async () => {
            mountedRoots.push(await hydrateApp({ tree, modules: coModules, root: container, url: 'http://localhost/' }));
        });

        const anchor = container.querySelector('a');
        await act(async () => {
            anchor!.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
        });

        expect(container.querySelector('main')?.textContent).toBe('co:loaded-on-client');
        expect(window.location.pathname).toBe('/co');
    });
});
