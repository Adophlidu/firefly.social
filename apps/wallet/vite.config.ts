import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { lingui } from '@lingui/vite-plugin';
import svgrJsx from '@svgr/plugin-jsx';
import svgrSvgo from '@svgr/plugin-svgo';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/wallet-iframe';
const NEXT_PUBLIC_VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development';
const PACKAGE_VERSION = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string;

const nodeRequire = createRequire(import.meta.url);
// createRequire resolves the CJS (.cjs) build of the polyfill shims, but the Nitro
// SSR module-runner evaluates the file as ESM, which throws "exports is not defined".
// Point at the ESM (.js) build instead.
const nodePolyfillShimEsm = (id: string) => nodeRequire.resolve(id).replace(/\.cjs$/, '.js');

export default defineConfig({
    base: BASE_PATH,
    // Expose NEXT_PUBLIC_* and VITE_* env vars to client via import.meta.env
    envPrefix: ['NEXT_PUBLIC_', 'VITE_'],
    server: {
        port: 3001,
        strictPort: true,
        hmr: {
            // When running behind Next.js proxy, HMR needs to connect to the Vite dev server directly
            // If WALLET_IFRAME_REWRITE is set, the iframe is served via proxy but HMR connects directly
            host: 'localhost',
            port: 3001,
            clientPort: 3001,
        },
        cors: true,
    },
    plugins: [
        viteTsconfigPaths(),
        nodePolyfills({
            include: ['buffer', 'process'],
            globals: {
                Buffer: true,
                process: true,
            },
        }),
        tanstackStart({
            srcDirectory: 'src',
            router: {
                basepath: BASE_PATH,
            },
        }),
        nitro(),
        react({
            babel: {
                plugins: ['macros', 'babel-plugin-react-compiler'],
            },
        }),
        lingui(),
        svgr({
            svgrOptions: {
                ref: true,
                plugins: [svgrSvgo, svgrJsx],
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
        // packages/web3 and apps/wallet each resolve wagmi from different pnpm
        // virtual store paths; dedupe so the same Config instance works across both.
        dedupe: ['wagmi', '@wagmi/core'],
        alias: {
            'react-native-webview': resolve(__dirname, 'src/shims/react-native-webview.ts'),
            pino: resolve(__dirname, 'src/shims/pino.ts'),
            '@react-native-async-storage/async-storage': resolve(__dirname, 'src/shims/async-storage.ts'),
            // vite-plugin-node-polyfills injects these shim imports as a dev banner
            // into every module — including the Nitro SSR environment, whose
            // module-runner can't resolve the bare subpaths (ERR_MODULE_NOT_FOUND),
            // breaking any server-evaluated module (e.g. @dimensiondev/workers-client).
            // Alias them to the installed files; node SSR has Buffer/process natively,
            // so the shim is a harmless no-op there. (Alias is inherited by the Nitro
            // env, unlike a resolveId plugin which only runs in the client env.)
            'vite-plugin-node-polyfills/shims/buffer': nodePolyfillShimEsm('vite-plugin-node-polyfills/shims/buffer'),
            'vite-plugin-node-polyfills/shims/process': nodePolyfillShimEsm('vite-plugin-node-polyfills/shims/process'),
            'vite-plugin-node-polyfills/shims/global': nodePolyfillShimEsm('vite-plugin-node-polyfills/shims/global'),
        },
    },
    define: {
        'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version ?? PACKAGE_VERSION),
        'process.env.COMMIT_HASH': JSON.stringify(process.env.COMMIT_HASH ?? ''),
        'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify(BASE_PATH),
        'process.env.NEXT_PUBLIC_VERCEL_ENV': JSON.stringify(NEXT_PUBLIC_VERCEL_ENV),
    },
    build: {},
    optimizeDeps: {
        include: ['buffer', 'react-use'],
    },
    ssr: {
        noExternal: ['react-use', '@lingui/core', '@lingui/react'],
        external: [
            '@solana/spl-token',
            '@solana/buffer-layout-utils',
            'bigint-buffer',
            'bindings',
            '@solana/wallet-adapter-base',
            // In ssr, alias doesn't work for pino
            'pino',
            'pino-std-serializers',
        ],
    },
});
