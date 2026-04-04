import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        include: ['tests/**/*.ts'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            // mdast is types-only, point to stub file for runtime
            mdast: resolve(__dirname, 'src/stubs/mdast.ts'),
        },
    },
});
