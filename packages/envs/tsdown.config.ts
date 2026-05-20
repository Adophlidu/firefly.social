import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/wallet.ts', 'src/web.ts'],
    fixedExtension: false,
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
});
