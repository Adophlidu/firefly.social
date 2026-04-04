import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import esbuild from 'esbuild';

import { findRepoRoot } from '../../../packages/scripts/repo-root.cjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = findRepoRoot(__dirname);
const webRoot = join(repoRoot, 'apps/web');

const webRequire = createRequire(join(webRoot, 'package.json'));
const twitterApiV2Entry = webRequire.resolve('twitter-api-v2/dist/esm/index.js');

dotenv.config({
    path: join(repoRoot, '.env.local'),
});

const envDefinitions = {};
for (const [key, value] of Object.entries(process.env || {})) {
    envDefinitions[`process.env.${key}`] = JSON.stringify(value);
}

const buildConfigs = [
    {
        entryPoints: [join(webRoot, 'src/service-workers/index.ts')],
        outfile: join(webRoot, 'public/sw.js'),
        target: 'es2020',
    },
    {
        entryPoints: [join(webRoot, 'src/service-workers/firebase-messaging-sw.ts')],
        outfile: join(webRoot, 'public/firebase-messaging-sw.js'),
        target: 'esnext',
    },
    {
        entryPoints: [twitterApiV2Entry],
        outfile: join(webRoot, 'prebuilt/twitter-api-v2.js'),
        target: 'es2020',
        external: ['fs', 'https', 'crypto', 'zlib'],
    },
    {
        entryPoints: [join(webRoot, 'src/scripts/home-redirect.ts')],
        outfile: join(webRoot, 'public/js/home-redirect.js'),
        target: 'es2020',
    },
];

await Promise.all(
    buildConfigs.map(async ({ entryPoints, outfile, target, external = [] }) => {
        await esbuild.build({
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

        console.log(`Built to ${outfile}.`);
    }),
);

await writeFile(
    join(webRoot, 'public/.well-known/appspecific/com.chrome.devtools.json'),
    JSON.stringify({
        workspace: {
            root: repoRoot,
            uuid: '412d882b-1031-4372-8684-c3fb8577ecab',
        },
    }),
    'utf8',
);
