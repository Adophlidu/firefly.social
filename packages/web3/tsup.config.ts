import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/utils.ts',
        'src/chains.ts',
        'src/resolvers.ts',
        'src/constants.ts',
        'src/numbers.ts',
        'src/enums.ts',
        'src/actions.ts',
        'src/abi.ts',
    ],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    splitting: false,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    external: ['wagmi', 'wagmi/actions'],
});
