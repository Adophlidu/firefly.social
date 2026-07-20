import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { ssrPlugin } from '@dimensiondev/ssr/vite';
import { lingui } from '@lingui/vite-plugin';
import svgrJsx from '@svgr/plugin-jsx';
import svgrSvgo from '@svgr/plugin-svgo';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// Next.js loads .env.local into process.env; the prebuilt @dimensiondev/envs/web
// package parses its internal (secret) schema from process.env at module scope
// on the server. Mirror that for the Vite SSR dev server and for builds.
// App-level .env.local wins over the repo-root one (first-loaded wins in dotenv).
dotenv.config({ path: resolve(__dirname, '.env.local') });
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const NEXT_PUBLIC_VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development';
const PACKAGE_VERSION = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string;

const nodeRequire = createRequire(import.meta.url);
// createRequire resolves the CJS (.cjs) build of the polyfill shims, but the Vite
// SSR environment evaluates the file as ESM, which throws "exports is not defined".
// Point at the ESM (.js) build instead.
const nodePolyfillShimEsm = (id: string) => nodeRequire.resolve(id).replace(/\.cjs$/, '.js');

/**
 * Next/webpack ships dual implementations per environment (see
 * .next-config/webpack.config.ts): the server gets linkedom/pino, the client
 * gets DOMParser/console. Reproduce that per Vite environment. Must run
 * before vite-tsconfig-paths, which would resolve the '@/' specifiers to
 * the real files first.
 */
function dualImplementationPlugin() {
    return {
        name: 'web:server-client-dual-implementation',
        enforce: 'pre' as const,
        resolveId(id: string, importer?: string) {
            const isSsr = this.environment?.name === 'ssr';
            const isParseHtml =
                id === '@/libs/parseHtml.js' ||
                id.endsWith('/src/libs/parseHtml.js') ||
                (id === './parseHtml.js' && importer?.includes('/src/libs/'));
            if (isParseHtml) {
                return resolve(__dirname, isSsr ? 'src/libs/parseHtml.ts' : 'src/libs/parseHtmlNative.ts');
            }
            const isLogger =
                id === '@/libs/Logger.js' ||
                id.endsWith('/src/libs/Logger.js') ||
                (id === './Logger.js' && importer?.includes('/src/libs/'));
            if (isLogger) {
                return resolve(__dirname, isSsr ? 'src/libs/Logger.ts' : 'src/libs/LoggerNative.ts');
            }
            return null;
        },
    };
}

export default defineConfig({
    // Expose NEXT_PUBLIC_* and VITE_* env vars to client via import.meta.env
    envPrefix: ['NEXT_PUBLIC_', 'VITE_'],
    // SVGR emits JSX into modules whose id ends in .svg, which
    // @vitejs/plugin-react skips; esbuild then compiles them with the
    // classic runtime and leaves a bare `React` global that crashes at
    // runtime (Workers/SSR). Force the automatic runtime; the
    // '@/shims/jsx-runtime' alias makes it resolvable from packages/assets
    // (which declares no react dependency).
    esbuild: {
        jsx: 'automatic',
    },
    plugins: [
        dualImplementationPlugin(),
        viteTsconfigPaths(),
        nodePolyfills({
            include: ['buffer', 'process'],
            globals: {
                Buffer: true,
                process: true,
            },
        }),
        ssrPlugin({
            routesDir: 'src/routes',
            entry: '/src/entry-server.ts',
            clientEntry: '/src/entry-client.tsx',
        }),
        react({
            babel: {
                plugins: [
                    // Web's providers use legacy experimental decorators
                    // (tsconfig experimentalDecorators); loose class properties
                    // are required alongside the legacy decorator transform.
                    ['@babel/plugin-proposal-decorators', { legacy: true }],
                    ['@babel/plugin-transform-class-properties', { loose: true }],
                    // lingui macros (@lingui/core/macro, @lingui/react/macro) are
                    // dispatched through babel-plugin-macros by @lingui/babel-plugin-lingui-macro.
                    'macros',
                ],
            },
        }),
        lingui(),
        svgr({
            // vite-plugin-svgr compiles svgr's JSX output with its own
            // esbuild pass (classic by default, leaving a bare `React`
            // global that crashes SSR/Workers). Force the automatic runtime
            // against the web-local shim — packages/assets declares no
            // react dependency, so plain 'react/jsx-runtime' would not
            // resolve from the generated modules.
            esbuildOptions: { jsx: 'automatic', jsxImportSource: '@/shims' },
            svgrOptions: {
                ref: true,
                plugins: [svgrSvgo, svgrJsx],
                // packages/assets declares no react dependency, so the SSR module
                // runner cannot resolve 'react' from the generated components.
                // Emit the automatic JSX runtime against a web-local shim that
                // re-exports it (resolvable from apps/web's node_modules).
                jsxRuntime: 'automatic',
                jsxRuntimeImport: { source: '@/shims/jsx-runtime', specifiers: ['Fragment', 'jsx', 'jsxs'] },
                svgoConfig: {
                    // SVGO v4 preset-default no longer runs removeViewBox.
                    plugins: ['preset-default', 'prefixIds'],
                },
            },
            include: '**/*.svg',
            exclude: '**/mask_pkgs/**/*.svg',
        }),
    ],
    resolve: {
        alias: {
            // SVGR emits this import into generated components living in
            // packages/assets, where the '@' tsconfig path does not apply.
            '@/shims/jsx-runtime': resolve(__dirname, 'src/shims/jsx-runtime.ts'),
            '@/shims/jsx-dev-runtime': resolve(__dirname, 'src/shims/jsx-dev-runtime.ts'),
            // pino cannot run in Workers (thread-stream worker threads); the
            // server-side Logger implementation reaches it, so stub it out.
            pino: resolve(__dirname, 'src/shims/pino.ts'),
            // next/font is Next-only; reuse the Vitest stubs so font modules load.
            'next/font/local': resolve(__dirname, 'src/stubs/next-font-local.ts'),
            'next/font/google': resolve(__dirname, 'src/stubs/next-font-google.ts'),
            // vite-plugin-node-polyfills injects these shim imports as a dev banner
            // into every module — including the SSR environment, whose
            // module-runner can't resolve the bare subpaths (ERR_MODULE_NOT_FOUND).
            // Alias them to the installed files; node SSR has Buffer/process natively,
            // so the shim is a harmless no-op there. (Alias is inherited by the SSR
            // env, unlike a resolveId plugin which only runs in the client env.)
            'vite-plugin-node-polyfills/shims/buffer': nodePolyfillShimEsm('vite-plugin-node-polyfills/shims/buffer'),
            'vite-plugin-node-polyfills/shims/process': nodePolyfillShimEsm('vite-plugin-node-polyfills/shims/process'),
            'vite-plugin-node-polyfills/shims/global': nodePolyfillShimEsm('vite-plugin-node-polyfills/shims/global'),
        },
    },
    define: {
        'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version ?? PACKAGE_VERSION),
        'process.env.COMMIT_HASH': JSON.stringify(process.env.COMMIT_HASH ?? ''),
        'process.env.NEXT_PUBLIC_VERCEL_ENV': JSON.stringify(NEXT_PUBLIC_VERCEL_ENV),
    },
    optimizeDeps: {
        include: ['buffer', 'react-use'],
    },
    ssr: {
        noExternal: ['react-use', '@lingui/core', '@lingui/react'],
        external: [
            '@napi-rs/image',
            'canvas',
            'thread-stream',
            // In ssr, alias doesn't work for pino
            'pino',
            'pino-std-serializers',
        ],
    },
});
