import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
        },
    },
});
