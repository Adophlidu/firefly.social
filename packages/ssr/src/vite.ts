import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin, RunnableDevEnvironment } from 'vite';

import type { ClientAssets } from './runtime/assets.tsx';
import { scanRoutesDirectory } from './vite/scan.ts';

export interface SsrPluginOptions {
    /** Routes directory relative to the project root. Defaults to `src/routes`. */
    routesDir?: string;
    /** First URL segment marking API routes. Defaults to `api`. */
    apiPrefix?: string;
    /**
     * SSR entry module (root-relative, e.g. `/src/entry-server.ts`) whose
     * default export is a `(request: Request) => Promise<Response>` handler
     * (or a `(request, env, ctx)` Workers handler). When set, the plugin
     * serves SSR/API requests through it in dev.
     */
    entry?: string;
    /**
     * Client entry module (root-relative, e.g. `/src/entry-client.tsx`).
     * When set, the plugin configures production builds for both
     * environments: `vite build --app` emits the client bundle + manifest
     * into `dist/client` and the deployable server bundle into
     * `dist/server`, and `virtual:ssr/client-assets` resolves the asset
     * URLs for `<ClientScripts>`/`<ClientStyles>`.
     */
    clientEntry?: string;
    /**
     * Mark route files as client-only. The server skips their modules
     * entirely — no evaluation, no SSR render, the nearest pendingComponent
     * is streamed instead — so client-only dependency graphs (wallets,
     * web3 SDKs, …) stay out of the server bundle. The client loads them
     * on navigation/hydration. API routes are never client-only.
     */
    clientOnly?: (file: string) => boolean;
}

export const VIRTUAL_ROUTES_ID = 'virtual:ssr/routes';
export const VIRTUAL_CLIENT_ASSETS_ID = 'virtual:ssr/client-assets';
export const VIRTUAL_WORKER_ID = 'virtual:ssr/worker';
const RESOLVED_VIRTUAL_ROUTES_ID = '\0virtual:ssr/routes';
const RESOLVED_VIRTUAL_CLIENT_ASSETS_ID = '\0virtual:ssr/client-assets';
const RESOLVED_VIRTUAL_WORKER_ID = '\0virtual:ssr/worker';

interface ViteManifestChunk {
    file: string;
    name?: string;
    src?: string;
    isEntry?: boolean;
    isDynamicEntry?: boolean;
    imports?: string[];
    css?: string[];
}

/** Join a URL base with a path, tolerating missing/trailing slashes. */
function joinUrl(base: string, path: string): string {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}

/**
 * Vite plugin wiring the file-based router into the app. It provides the
 * `virtual:ssr/routes` module:
 *
 * ```ts
 * import { tree, modules } from 'virtual:ssr/routes';
 * ```
 *
 * Route modules are registered as lazy loaders (`() => import(...)`): each
 * route's dependency graph is only evaluated when a request matches it,
 * which keeps browser-only libraries out of the server's startup scope
 * (Cloudflare Workers forbid async I/O in global scope) and lays the
 * groundwork for client code splitting.
 */
export function ssrPlugin(options: SsrPluginOptions = {}): Plugin {
    let root = '';
    let base = '/';
    let command: 'serve' | 'build' = 'serve';
    let routesDirectory = '';

    /** Resolve the client asset URLs for the current command. */
    async function resolveClientAssets(): Promise<ClientAssets> {
        const clientEntry = options.clientEntry ?? '/src/entry-client.tsx';
        if (command === 'serve') {
            return { scripts: [joinUrl(base, clientEntry)], styles: [] };
        }
        const manifestPath = path.join(root, 'dist/client/.vite/manifest.json');
        const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<
            string,
            ViteManifestChunk
        >;
        const entryChunk = Object.values(manifest).find((chunk) => chunk.isEntry);
        if (!entryChunk) {
            throw new Error(`[ssr] no entry chunk found in ${manifestPath} (build client first)`);
        }

        // Map every route file to its client chunk + extracted CSS, so the
        // server can ship the matched chain's stylesheets with the HTML.
        // CSS is collected recursively through each chunk's static imports:
        // Vite attaches extracted CSS to the shared chunk that owns it, not
        // to the route facade that (transitively) imports it.
        const collectCss = (chunk: ViteManifestChunk, seen: Set<string>): string[] => {
            if (seen.has(chunk.file)) return [];
            seen.add(chunk.file);
            const css = [...(chunk.css ?? [])];
            for (const imported of chunk.imports ?? []) {
                const importedChunk = manifest[imported];
                if (importedChunk) css.push(...collectCss(importedChunk, seen));
            }
            return css;
        };

        const files = await scanRoutesDirectory(routesDirectory);
        const routes: NonNullable<ClientAssets['routes']> = {};
        for (const file of files) {
            const key = path.relative(root, path.join(routesDirectory, file)).split(path.sep).join('/');
            let chunk = manifest[key];
            if (!chunk) {
                // A route chunk can lose its source-keyed manifest entry
                // (e.g. the root _layout, which is also statically
                // reachable); fall back to the src-less dynamic entry with
                // the same module name.
                const name = file.replace(/\.[^.]+$/, '').split('/').pop();
                const candidates = Object.values(manifest).filter(
                    (candidate) => candidate.isDynamicEntry && !candidate.src && candidate.name === name,
                );
                if (candidates.length === 1) chunk = candidates[0];
            }
            if (!chunk) continue;
            const css = collectCss(chunk, new Set());
            routes[file] = {
                scripts: [joinUrl(base, chunk.file)],
                styles: css.map((file) => joinUrl(base, file)),
            };
        }

        return {
            scripts: [joinUrl(base, entryChunk.file)],
            styles: (entryChunk.css ?? []).map((file) => joinUrl(base, file)),
            routes,
        };
    }

    return {
        name: '@dimensiondev/ssr',

        config() {
            return {
                // SSR apps own the entire middleware stack below Vite's
                // asset pipeline; no index.html fallback, no built-in 404.
                ...(options.entry ? { appType: 'custom' as const } : {}),
                ...(options.clientEntry && options.entry
                    ? {
                          environments: {
                              client: {
                                  build: {
                                      outDir: 'dist/client',
                                      manifest: true,
                                      rollupOptions: {
                                          input: options.clientEntry,
                                      },
                                  },
                              },
                              ssr: {
                                  build: {
                                      outDir: 'dist/server',
                                      // Public assets belong to the client
                                      // bundle (served via ASSETS); copying
                                      // them into the server bundle bloats
                                      // the deploy artifact by tens of MB.
                                      copyPublicDir: false,
                                      rollupOptions: {
                                          input: VIRTUAL_WORKER_ID,
                                          output: {
                                              // The real entry chunk is renamed so
                                              // the plugin can emit a clean
                                              // `worker.js` facade on top (see
                                              // generateBundle below).
                                              entryFileNames: 'ssr-worker.js',
                                          },
                                      },
                                  },
                              },
                          },
                      }
                    : {}),
            };
        },

        configResolved(config) {
            root = config.root;
            base = config.base ?? '/';
            command = config.command;
            routesDirectory = path.resolve(root, options.routesDir ?? 'src/routes');
        },

        resolveId(id) {
            if (id === VIRTUAL_ROUTES_ID) return RESOLVED_VIRTUAL_ROUTES_ID;
            if (id === VIRTUAL_CLIENT_ASSETS_ID) return RESOLVED_VIRTUAL_CLIENT_ASSETS_ID;
            if (id === VIRTUAL_WORKER_ID) return RESOLVED_VIRTUAL_WORKER_ID;
            return null;
        },

        async load(id) {
            if (id === RESOLVED_VIRTUAL_WORKER_ID) {
                const entrySpecifier =
                    '/' +
                    path
                        .relative(root, path.resolve(root, (options.entry ?? '').replace(/^\//, '')))
                        .split(path.sep)
                        .join('/');
                return [
                    `import handler from ${JSON.stringify(entrySpecifier)};`,
                    `export default { fetch: handler };`,
                ].join('\n');
            }

            if (id === RESOLVED_VIRTUAL_CLIENT_ASSETS_ID) {
                const assets = await resolveClientAssets();
                return `export default ${JSON.stringify(assets)};`;
            }

            if (id !== RESOLVED_VIRTUAL_ROUTES_ID) return null;
            const files = await scanRoutesDirectory(routesDirectory);

            // Lazy loaders: the client dependency graph of each route module
            // is only evaluated when a request actually matches it. Eagerly
            // importing everything would evaluate browser-only libraries at
            // server startup — which Cloudflare Workers' global scope forbids.
            // Client-only modules are excluded from the SSR environment's
            // module map entirely, keeping their chunks out of the server
            // bundle (they still ship in the client bundle).
            const isSsrEnvironment = this.environment?.name === 'ssr';
            const moduleEntries = files
                .filter((file) => !isSsrEnvironment || !options.clientOnly?.(file))
                .map((file) => {
                    const absolute = path.join(routesDirectory, file);
                    const specifier = '/' + path.relative(root, absolute).split(path.sep).join('/');
                    return `${JSON.stringify(file)}: () => import(${JSON.stringify(specifier)})`;
                })
                .join(', ');

            return [
                `import { buildRouteTree } from '@dimensiondev/ssr';`,
                `export const files = ${JSON.stringify(files)};`,
                `export const modules = { ${moduleEntries} };`,
                `const clientOnlyFiles = new Set(${JSON.stringify(files.filter((file) => options.clientOnly?.(file)))});`,
                `export const tree = buildRouteTree({ files, apiPrefix: ${JSON.stringify(options.apiPrefix ?? 'api')}, clientOnly: (file) => clientOnlyFiles.has(file) });`,
            ].join('\n');
        },

        generateBundle() {
            if (this.environment?.name !== 'ssr' || !options.entry) return;
            // Rollup exposes bindings shared between the entry chunk and
            // lazily-imported route chunks as *named exports of the entry
            // module*. Cloudflare Workers (workerd) validates every named
            // export of the worker entry as a potential entrypoint and
            // rejects non-handler values ("Incorrect type for map entry
            // '<name>'"). Emit a facade that re-exports only the default
            // handler so the deployed module surface stays clean.
            this.emitFile({
                type: 'asset',
                fileName: 'worker.js',
                source: `export { default } from './ssr-worker.js';\n`,
            });
        },

        configureServer(server) {
            const onRouteFileListChanged = (file: string) => {
                if (!file.startsWith(routesDirectory)) return;
                const module = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ROUTES_ID);
                if (module) server.moduleGraph.invalidateModule(module);
                server.ws.send({ type: 'full-reload' });
            };
            // New/removed route files change the tree itself; edited route
            // modules flow through Vite's normal HMR.
            server.watcher.on('add', onRouteFileListChanged);
            server.watcher.on('unlink', onRouteFileListChanged);

            if (!options.entry) return;

            // Post hook: let Vite's own middlewares (HMR client, transforms,
            // public files) handle what they can; everything else is SSR.
            return () => {
                server.middlewares.use(async (req, res, next) => {
                    try {
                        const ssrEnvironment = server.environments.ssr as RunnableDevEnvironment;
                        const entry = (await ssrEnvironment.runner.import(options.entry!)) as {
                            default?: (request: Request) => Promise<Response>;
                        };
                        if (!entry.default) throw new Error(`${options.entry} has no default export`);

                        const url = `http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`;
                        const method = req.method ?? 'GET';
                        const headers = new Headers();
                        for (const [key, value] of Object.entries(req.headers)) {
                            if (value === undefined) continue;
                            headers.set(key, Array.isArray(value) ? value.join(', ') : value);
                        }
                        const request = new Request(url, {
                            method,
                            headers,
                            body: method === 'GET' || method === 'HEAD' ? undefined : (req as never),
                            // Node requires `duplex` when the body is a stream.
                            duplex: 'half',
                        } as RequestInit);

                        const response = await entry.default(request);
                        res.statusCode = response.status;
                        response.headers.forEach((value, key) => res.setHeader(key, value));
                        if (!response.body) {
                            res.end();
                            return;
                        }
                        for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
                            res.write(chunk);
                        }
                        res.end();
                    } catch (error) {
                        console.error('[ssr] dev middleware error', error);
                        next(error);
                    }
                });
            };
        },
    };
}

export default ssrPlugin;
