import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts', 'src/react.ts'],
    format: ['esm', 'cjs'],
    fixedExtension: false,
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
});
