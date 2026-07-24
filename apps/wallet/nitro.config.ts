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
    // Disabled: @vercel/otel's auto-instrumentation setup crashes some routes
    // under Nitro's Vercel-preset "web entry format" (missing
    // process.versions.node reaches it via a deferred/lazily-installed hook
    // that a synchronous try/catch around registerOTel() doesn't cover — see
    // src/server/plugins/otel.ts and PR #9541 for the full incident writeup).
    // Re-enable once that's root-caused properly, not under incident pressure.
    // plugins: ['./src/server/plugins/otel.ts'],
    // The Vercel preset enables SSR sourcemaps by default. Generating them for
    // the ~12k-module server bundle peaks Rollup's resident memory during chunk
    // rendering and OOMs the 8 GB build container (SIGKILL mid-render, which also
    // produces the misleading "No Output Directory named dist"). The minified
    // server stack traces aren't consumed by any source-map-aware tool here, so
    // disabling them is the cheapest way back under the memory ceiling.
    sourcemap: false,
    rollupConfig: {
        plugins: [cjsCompatPlugin],
    },
});
