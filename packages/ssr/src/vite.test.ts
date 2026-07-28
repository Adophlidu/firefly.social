import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createBuilder, createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ssrPlugin } from './vite.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(here, '../test/fixtures/demo');
const packageRoot = path.join(here, '..');

const libraryAliases = [
    {
        find: '@dimensiondev/ssr/server',
        replacement: path.join(packageRoot, 'src/server.ts'),
    },
    {
        find: '@dimensiondev/ssr/client',
        replacement: path.join(packageRoot, 'src/client.tsx'),
    },
    {
        find: '@dimensiondev/ssr',
        replacement: path.join(packageRoot, 'src/index.ts'),
    },
];

describe('ssrPlugin (vite dev integration)', () => {
    let server: ViteDevServer;
    let handler: (request: Request) => Promise<Response>;

    beforeAll(async () => {
        server = await createServer({
            root: fixtureRoot,
            logLevel: 'silent',
            plugins: [ssrPlugin({ routesDir: 'routes' })],
            resolve: { alias: libraryAliases },
        });
        const entry = (await server.environments.ssr.runner.import('/entry-server.ts')) as {
            default: typeof handler;
        };
        handler = entry.default;
    });

    afterAll(async () => {
        await server?.close();
    });

    it('scans the routes directory into a working SSR handler', async () => {
        const response = await handler(new Request('http://localhost/'));
        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html).toContain('<h1>demo-works</h1>');
        expect(html).toContain('<title>Demo — demo-works</title>');
        expect(html).toContain('id="__SSR_DATA__"');
    });

    it('dispatches API routes from the same file conventions', async () => {
        const getResponse = await handler(new Request('http://localhost/api/hello'));
        expect(getResponse.status).toBe(200);
        expect(await getResponse.json()).toEqual({ ok: true, path: '/api/hello' });

        const postResponse = await handler(new Request('http://localhost/api/hello', { method: 'POST' }));
        expect(await postResponse.text()).toBe('created');
    });

    it('returns 404 for unknown paths', async () => {
        const response = await handler(new Request('http://localhost/missing'));
        expect(response.status).toBe(404);
    });
});

describe('ssrPlugin dev middleware', () => {
    let server: ViteDevServer;
    let baseUrl: string;

    beforeAll(async () => {
        server = await createServer({
            root: fixtureRoot,
            logLevel: 'silent',
            plugins: [ssrPlugin({ routesDir: 'routes', entry: '/entry-server.ts' })],
            resolve: { alias: libraryAliases },
            server: { port: 0 },
        });
        await server.listen();
        const address = server.httpServer?.address();
        if (!address || typeof address === 'string') throw new Error('no http server');
        baseUrl = `http://localhost:${address.port}`;
    });

    afterAll(async () => {
        await server?.close();
    });

    it('serves SSR pages and API routes over HTTP', async () => {
        const page = await fetch(`${baseUrl}/`);
        expect(page.status).toBe(200);
        const html = await page.text();
        expect(html).toContain('<h1>demo-works</h1>');
        // Dev bootstrap is injected into SSR HTML responses.
        expect(html).toContain('src="/@vite/client"');

        const api = await fetch(`${baseUrl}/api/hello`);
        expect(await api.json()).toEqual({ ok: true, path: '/api/hello' });
    });
});

describe('ssrPlugin production build', () => {
    const distDirectory = path.join(fixtureRoot, 'dist');

    beforeAll(async () => {
        await rm(distDirectory, { recursive: true, force: true });
        const builder = await createBuilder({
            root: fixtureRoot,
            logLevel: 'silent',
            plugins: [
                ssrPlugin({
                    routesDir: 'routes',
                    entry: '/entry-server.ts',
                    clientEntry: '/entry-client.tsx',
                }),
            ],
            resolve: { alias: libraryAliases },
        });
        await builder.buildApp();
    }, 120_000);

    afterAll(async () => {
        await rm(distDirectory, { recursive: true, force: true });
    });

    it('emits the client bundle with a manifest and the server bundle', async () => {
        const clientFiles = await readdir(path.join(distDirectory, 'client', 'assets'), {
            recursive: true,
        });
        expect(clientFiles.some((file) => String(file).endsWith('.js'))).toBe(true);

        const serverFiles = await readdir(path.join(distDirectory, 'server'));
        expect(serverFiles.some((file) => file.endsWith('.js'))).toBe(true);
    });

    it('the server bundle renders HTML referencing the hashed client bundle', async () => {
        const serverFiles = await readdir(path.join(distDirectory, 'server'));
        const bundleFile = serverFiles.find((file) => file.endsWith('.js'));
        expect(bundleFile).toBeDefined();

        const serverModule = (await import(pathToFileURL(path.join(distDirectory, 'server', bundleFile!)).href)) as {
            default: { fetch: (request: Request) => Promise<Response> };
        };

        const response = await serverModule.default.fetch(new Request('http://localhost/'));
        expect(response.status).toBe(200);
        const html = await response.text();
        expect(html).toContain('<h1>demo-works</h1>');
        // The script tag points at the hashed production bundle, not the dev entry.
        expect(html).toMatch(/<script type="module" src="\/assets\/entry-client-[^"]+\.js"><\/script>/);

        const api = await serverModule.default.fetch(new Request('http://localhost/api/hello'));
        expect(await api.json()).toEqual({ ok: true, path: '/api/hello' });
    });
});
