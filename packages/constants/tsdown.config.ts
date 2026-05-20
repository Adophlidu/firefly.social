import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/runtime.ts', 'src/static.ts', 'src/computed.ts'],
    fixedExtension: false,
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
});
