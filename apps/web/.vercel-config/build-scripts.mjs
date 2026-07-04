import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import esbuild from 'esbuild';

function findRepoRoot(fromDir) {
    let dir = resolve(fromDir);
    for (;;) {
        if (existsSync(join(dir, 'pnpm-lock.yaml')) && existsSync(join(dir, 'package.json'))) {
            return dir;
        }
        const parent = dirname(dir);
        if (parent === dir) {
            throw new Error(`Could not find monorepo root (pnpm-lock.yaml + package.json) starting from ${fromDir}`);
        }
        dir = parent;
    }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = findRepoRoot(__dirname);
const webRoot = join(repoRoot, 'apps/web');

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
        entryPoints: [join(webRoot, 'src/scripts/home-redirect.ts')],
        outfile: join(webRoot, 'public/js/home-redirect.js'),
        target: 'es2020',
    },
];

await Promise.all(
    buildConfigs.map(async ({ entryPoints, outfile, target, external = [], plugins = [] }) => {
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
            plugins,
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
