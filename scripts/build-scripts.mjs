import dotenv from 'dotenv';
import esbuild from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

dotenv.config({
    path: '.env.local',
});

const envDefinitions = {};
for (const [key, value] of Object.entries(process.env || {})) {
    envDefinitions[`process.env.${key}`] = JSON.stringify(value);
}

const buildConfigs = [
    { entryPoints: ['src/service-workers/index.ts'], outfile: 'public/sw.js', target: 'es2020' },
    {
        entryPoints: ['src/service-workers/firebase-messaging-sw.ts'],
        outfile: 'public/firebase-messaging-sw.js',
        target: 'esnext',
    },
    {
        entryPoints: ['node_modules/twitter-api-v2/dist/esm/index.js'],
        outfile: 'prebuilt/twitter-api-v2.js',
        target: 'es2020',
        external: ['fs', 'https', 'crypto', 'zlib'],
    },
    {
        entryPoints: ['src/scripts/home-redirect.ts'],
        outfile: 'public/js/home-redirect.js',
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
    new URL('../public/.well-known/appspecific/com.chrome.devtools.json', import.meta.url),
    JSON.stringify({
        workspace: {
            root: join(import.meta.dirname, '../'),
            uuid: '412d882b-1031-4372-8684-c3fb8577ecab',
        },
    }),
    'utf8',
);
