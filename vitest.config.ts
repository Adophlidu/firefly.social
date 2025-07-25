import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        include: ['tests/**/*.ts'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
