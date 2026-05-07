import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts'],
    fixedExtension: false,
    dts: true,
    clean: true,
    sourcemap: true,
    deps: {
        neverBundle: ['lodash-es'],
    },
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
});
