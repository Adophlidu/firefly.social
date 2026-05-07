import { defineConfig } from 'tsdown';

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
    fixedExtension: false,
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    deps: {
        neverBundle: ['wagmi', 'wagmi/actions'],
    },
});
