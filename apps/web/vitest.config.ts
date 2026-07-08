import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    // Transform .tsx with the automatic JSX runtime, matching the production SWC
    // setup (tsconfig "jsx": "preserve" + @lingui/swc-plugin). Without this, esbuild
    // falls back to the classic runtime (React.createElement), so any test that calls
    // a .tsx helper which builds JSX titles (e.g. getSportMarketTabs' <Trans>) throws
    // "React is not defined" because those modules don't import React.
    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
    },
    test: {
        include: ['tests/**/*.ts'],
    },
    resolve: {
        // apps/web and packages/web3 each resolve wagmi from different pnpm
        // virtual store paths; dedupe so vi.mock('wagmi/actions') matches
        // imports inside @dimensiondev/web3 (e.g. getBalanceOf).
        dedupe: ['wagmi', '@wagmi/core'],
        alias: {
            '@': resolve(__dirname, 'src'),
            // mdast is types-only, point to stub file for runtime
            mdast: resolve(__dirname, 'src/stubs/mdast.ts'),
            // @lingui/core/macro requires SWC/Babel transform; stub for tests
            '@lingui/core/macro': resolve(__dirname, 'src/stubs/lingui-core-macro.ts'),
            // next/font/local has no jsdom implementation; stub so font modules load in tests
            'next/font/local': resolve(__dirname, 'src/stubs/next-font-local.ts'),
        },
    },
});
