import { defineNitroConfig } from 'nitro/config';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '/wallet-iframe';

/**
 * Rollup plugin to inject __filename/__dirname polyfills for ESM chunks
 * that contain CJS code using these globals (e.g., the `bindings` package).
 */
const cjsCompatPlugin = {
    name: 'cjs-compat-polyfill',
    renderChunk(code: string) {
        if (code.includes('__filename') || code.includes('__dirname')) {
            const polyfill = [
                `import { fileURLToPath as __cjs_fileURLToPath__ } from 'node:url';`,
                `import { dirname as __cjs_dirname__ } from 'node:path';`,
                `const __filename = __cjs_fileURLToPath__(import.meta.url);`,
                `const __dirname = __cjs_dirname__(__filename);`,
                '',
            ].join('\n');
            return polyfill + code;
        }
        return null;
    },
};

export default defineNitroConfig({
    preset: 'vercel',
    baseURL: BASE_PATH,
    rollupConfig: {
        plugins: [cjsCompatPlugin],
    },
});
