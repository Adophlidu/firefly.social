import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts', 'src/client.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    splitting: false,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    external: ['react', 'react-use'],
});
