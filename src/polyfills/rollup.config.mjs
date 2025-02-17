import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import { swc } from 'rollup-plugin-swc3';
import { terser } from 'rollup-plugin-terser';

export default defineConfig({
    output: {
        file: './public/js/polyfills/base.js',
        format: 'es',
        generatedCode: 'es2015',
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        swc({
            tsconfig: './tsconfig.json',
            jsc: { target: 'es2020' },
        }),
        terser({ mangle: false }),
    ],
});
