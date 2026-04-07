import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { lingui } from '@lingui/vite-plugin';
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
                svgoConfig: {
                    plugins: [
                        {
                            name: 'preset-default',
                            params: {
                                overrides: {
                                    removeViewBox: false,
                                },
                            },
                        },
                        { name: 'prefixIds' },
                    ],
                },
            },
            include: '**/*.svg',
            exclude: '**/mask_pkgs/**/*.svg',
        }),
    ],
    resolve: {
        alias: {
            '@react-native-async-storage/async-storage': resolve(__dirname, 'src/shims/async-storage.ts'),
        },
    },
    define: {
        'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version ?? PACKAGE_VERSION),
        'process.env.COMMIT_HASH': JSON.stringify(process.env.COMMIT_HASH ?? ''),
        'process.env.WEB3_CONSTANTS_RPC': JSON.stringify(process.env.WEB3_CONSTANTS_RPC ?? ''),
        'process.env.MASK_MIXPANEL': JSON.stringify('disabled'),
        'process.env.NEXT_PUBLIC_BASE_PATH': JSON.stringify(BASE_PATH),
        'process.env.NEXT_PUBLIC_VERCEL_ENV': JSON.stringify(NEXT_PUBLIC_VERCEL_ENV),
    },
    build: {},
    optimizeDeps: {
        include: ['buffer', 'react-use'],
    },
    ssr: {
        noExternal: ['react-use', '@lingui/core', '@lingui/react', '@privy-io/react-auth'],
        external: ['@solana/spl-token', '@solana/buffer-layout-utils', 'bigint-buffer', 'bindings'],
    },
});
