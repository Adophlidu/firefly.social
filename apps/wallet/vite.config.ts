import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { lingui } from '@lingui/vite-plugin';
import { ssrPlugin } from '@dimensiondev/ssr/vite';
import svgrJsx from '@svgr/plugin-jsx';
import svgrSvgo from '@svgr/plugin-svgo';
import { tamaguiPlugin } from '@tamagui/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import svgr from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/wallet-iframe';
const NEXT_PUBLIC_VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development';
const PACKAGE_VERSION = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string;

// Resolve the Tamagui config from the published @dimensiondev/rn-ui package
// (it exposes `./tamagui.config`); the wallet no longer depends on in-repo source.
const rnUiTamaguiConfig = createRequire(import.meta.url).resolve('@dimensiondev/rn-ui/tamagui.config');

const nodeRequire = createRequire(import.meta.url);
// createRequire resolves the CJS (.cjs) build of the polyfill shims, but the Vite
// SSR environment evaluates the file as ESM, which throws "exports is not defined".
// Point at the ESM (.js) build instead.
const nodePolyfillShimEsm = (id: string) => nodeRequire.resolve(id).replace(/\.cjs$/, '.js');

export default defineConfig({
    base: BASE_PATH,
    // Expose NEXT_PUBLIC_* and VITE_* env vars to client via import.meta.env
    envPrefix: ['NEXT_PUBLIC_', 'VITE_'],
    // SVGR emits JSX into modules whose id ends in .svg, which
    // @vitejs/plugin-react skips; esbuild then compiles them with the
    // classic runtime and leaves a bare `React` global that crashes at
    // runtime (Workers/SSR). Force the automatic runtime; the
    // 'react/jsx-runtime' alias makes it resolvable from packages/assets
    // (which declares no react dependency).
    esbuild: {
        jsx: 'automatic',
    },
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
        {
            // The Privy/wagmi/appkit group (ClientProviders' dynamic imports,
            // the modal registry) never loads during SSR, but it still lands
            // in the worker artifact and blows the 3 MiB free-plan limit.
            // Stub those imports in the ssr environment only; the client
            // build resolves the real modules. Must run before
            // vite-tsconfig-paths, which would resolve the '@/' specifiers
            // to the real files first.
            name: 'wallet:ssr-client-only-stubs',
            enforce: 'pre',
            resolveId(id) {
                if (this.environment?.name !== 'ssr') return null;
                switch (id) {
                    case '@/components/Providers.js':
                    case '@/components/PrivyWalletAutomator.js':
                    case '@/components/FireflyWalletIframeBridge.js':
                        return resolve(__dirname, 'src/shims/client-providers-stub.tsx');
                    case '@/modals/index.js':
                        return resolve(__dirname, 'src/shims/modals-stub.tsx');
                    default:
                        return null;
                }
            },
        },
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
            // The wallet's SSR renders only the root shell (everything behind
            // ClientProviders is client-gated anyway). Marking all component
            // routes client-only keeps the web3 dependency graph out of the
            // worker bundle (free-plan 3 MiB limit).
            clientOnly: (file) => file !== '__root.tsx' && !file.startsWith('api/'),
        }),
        tamaguiPlugin({
            optimize: true,
            // Wallet already aliases react-native / react-native-svg for RNW; avoid Tamagui overriding.
            disableResolveConfig: true,
            config: rnUiTamaguiConfig,
            components: ['tamagui'],
        }),
        react({
            babel: {
                plugins: ['macros', 'babel-plugin-react-compiler'],
            },
        }),
        lingui(),
        svgr({
            // vite-plugin-svgr compiles svgr's JSX output with its own
            // esbuild pass (classic by default, leaving a bare `React`
            // global that crashes SSR/Workers). Force the automatic runtime
            // against the wallet-local shim — packages/assets declares no
            // react dependency, so plain 'react/jsx-runtime' would not
            // resolve from the generated modules.
            esbuildOptions: { jsx: 'automatic', jsxImportSource: '@/shims' },
            svgrOptions: {
                ref: true,
                plugins: [svgrSvgo, svgrJsx],
                // packages/assets declares no react dependency, so the SSR module
                // runner cannot resolve 'react' from the generated components.
                // Emit the automatic JSX runtime against a wallet-local shim that
                // re-exports it (resolvable from apps/wallet's node_modules).
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
        // packages/web3 and apps/wallet each resolve wagmi from different pnpm
        // virtual store paths; dedupe so the same Config instance works across both.
        dedupe: ['wagmi', '@wagmi/core'],
        alias: {
            // SVGR emits this import into generated components living in
            // packages/assets, where the '@' tsconfig path does not apply.
            '@/shims/jsx-runtime': resolve(__dirname, 'src/shims/jsx-runtime.ts'),
            '@/shims/jsx-dev-runtime': resolve(__dirname, 'src/shims/jsx-dev-runtime.ts'),
            // react-native-web imports inline-style-prefixer's CJS deep paths,
            // which the SSR module runner cannot interop; use its ESM build.
            // (css-in-js-utils is its dependency with the same layout.)
            'inline-style-prefixer/lib': nodeRequire
                .resolve('inline-style-prefixer/es/createPrefixer')
                .replace(/createPrefixer\.js$/, '')
                .replace(/\/$/, ''),
            'css-in-js-utils/lib': nodeRequire
                .resolve('css-in-js-utils/es/isPrefixedValue')
                .replace(/isPrefixedValue\.js$/, '')
                .replace(/\/$/, ''),
            'react-native': resolve(__dirname, 'node_modules/react-native-web'),
            'react-native-svg': resolve(__dirname, 'node_modules/@tamagui/react-native-svg'),
            'react-native-webview': resolve(__dirname, 'src/shims/react-native-webview.ts'),
            pino: resolve(__dirname, 'src/shims/pino.ts'),
            '@react-native-async-storage/async-storage': resolve(__dirname, 'src/shims/async-storage.ts'),
            // vite-plugin-node-polyfills injects these shim imports as a dev banner
            // into every module — including the SSR environment, whose
            // module-runner can't resolve the bare subpaths (ERR_MODULE_NOT_FOUND),
            // breaking any server-evaluated module (e.g. @dimensiondev/workers-client).
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
        'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify(BASE_PATH),
        'process.env.NEXT_PUBLIC_VERCEL_ENV': JSON.stringify(NEXT_PUBLIC_VERCEL_ENV),
    },
    build: {},
    optimizeDeps: {
        include: ['buffer', 'react-use'],
    },
    ssr: {
        // @dimensiondev/rn-ui and the tamagui packages ship builds node ESM
        // cannot parse when externalized; let Vite process them instead.
        // The @reown/lit packages must be bundled with node resolve
        // conditions: their browser builds touch DOM globals (HTMLElement)
        // at module scope, which crashes the Workers runtime on evaluation.
        noExternal: [
            'react-use',
            '@lingui/core',
            '@lingui/react',
            '@dimensiondev/rn-ui',
            /^@?tamagui/,
            /^@reown\//,
            /^lit($|\/)/,
            /^@lit/,
        ],
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
