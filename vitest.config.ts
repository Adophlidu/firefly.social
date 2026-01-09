import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        include: ['tests/**/*.ts', 'packages/**/src/**/*.test.ts'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            // mdast is types-only, point to stub file for runtime
            mdast: resolve(__dirname, 'src/stubs/mdast.ts'),
        },
    },
});
