import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/index.ts', 'src/server.ts', 'src/client.tsx', 'src/cloudflare.ts', 'src/vite.ts'],
    format: ['esm', 'cjs'],
    fixedExtension: false,
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    minify: false,
    target: 'es2022',
    outDir: 'dist',
});
