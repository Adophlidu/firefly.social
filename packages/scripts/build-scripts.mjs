import dotenv from 'dotenv';
import esbuild from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findRepoRoot } from './repo-root.cjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = findRepoRoot(__dirname);

dotenv.config({
    path: join(repoRoot, '.env.local'),
});

const envDefinitions = {};
for (const [key, value] of Object.entries(process.env || {})) {
    envDefinitions[`process.env.${key}`] = JSON.stringify(value);
}

const buildConfigs = [
    {
        entryPoints: [join(repoRoot, 'src/service-workers/index.ts')],
        outfile: join(repoRoot, 'public/sw.js'),
        target: 'es2020',
    },
    {
        entryPoints: [join(repoRoot, 'src/service-workers/firebase-messaging-sw.ts')],
        outfile: join(repoRoot, 'public/firebase-messaging-sw.js'),
        target: 'esnext',
    },
    {
        entryPoints: [join(repoRoot, 'node_modules/twitter-api-v2/dist/esm/index.js')],
        outfile: join(repoRoot, 'prebuilt/twitter-api-v2.js'),
        target: 'es2020',
        external: ['fs', 'https', 'crypto', 'zlib'],
    },
    {
        entryPoints: [join(repoRoot, 'src/scripts/home-redirect.ts')],
        outfile: join(repoRoot, 'public/js/home-redirect.js'),
        target: 'es2020',
    },
];

buildConfigs.forEach(({ entryPoints, outfile, target, external = [] }) => {
    esbuild.build({
        target,
        platform: 'browser',
        entryPoints,
        outfile,
        allowOverwrite: true,
        format: 'esm',
        bundle: true,
        minify: true,
        define: envDefinitions,
        external,
    });

    console.log(`Service worker built to ${outfile}.`);
});

await writeFile(
    join(repoRoot, 'public/.well-known/appspecific/com.chrome.devtools.json'),
    JSON.stringify({
        workspace: {
            root: repoRoot,
            uuid: '412d882b-1031-4372-8684-c3fb8577ecab',
        },
    }),
    'utf8',
);
