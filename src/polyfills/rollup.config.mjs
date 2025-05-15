import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { defineConfig } from 'rollup';
import { swc } from 'rollup-plugin-swc3';
import { terser } from 'rollup-plugin-terser';
import data from 'core-js-compat/compat.js';
import { writeFileSync } from 'node:fs';

const core_js_modules = data({
    targets: {
        safari: '>=16',
        chrome: '>=103',
        firefox: '>=100',
        opera: '>=89',
        edge: '>=103',
    },
    modules: ['core-js/actual'],
}).list.map((x) => `import 'core-js/modules/${x}';`);
writeFileSync(new URL('./core-js.js', import.meta.url), core_js_modules.join('\n'), 'utf-8');

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
    onLog: (level, log, defaultHandler) => {
        defaultHandler(log.code === 'UNRESOLVED_IMPORT' ? 'error' : level, log);
    },
});
