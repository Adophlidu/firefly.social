/* cspell:disable */
/* eslint-disable no-relative-import-paths/no-relative-import-paths */

import { execSync } from 'child_process';
import { createRequire } from 'module';
import type { NextConfig } from 'next';

import { headersConfig } from './.next-config/headers.config';
import { imagesConfig } from './.next-config/images.config';
import { redirectsConfig } from './.next-config/redirects.config';
import { rewritesConfig } from './.next-config/rewrites.config';
import { svgrOptions } from './.next-config/svgrOptions';
import { webpackConfig } from './.next-config/webpack.config';

const require = createRequire(import.meta.url);

const config: NextConfig = {
    allowedDevOrigins: ['firefly.social'],
    productionBrowserSourceMaps: false,

    // Vercel Skew Protection: pins clients to their deployment so RSC router-state
    // matches the rendering server (fixes E10 parse errors). Undefined off-Vercel.
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID,

    serverExternalPackages: ['@napi-rs/image'],

    // Note: we run tsc and eslint in other places
    typescript: {
        ignoreBuildErrors: true,
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    env: {
        VERSION: require('./package.json').version,
        COMMIT_HASH: execSync('git rev-parse --short HEAD').toString().trim(),
        FIREFLY_EXCEPTION_TRACKER_API_KEY: process.env.FIREFLY_EXCEPTION_TRACKER_API_KEY,
    },
    experimental: {
        // Persist Turbopack output between `next build` runs (Vercel restores .next/cache).
        // Keeps warm production builds fast; unrelated to RSC flight payload size.
        turbopackFileSystemCacheForBuild: true,
        // On Vercel builds Next auto-enables this flag (hasNextSupport + NEXT_DEPLOYMENT_ID),
        // deferring chunk-URL deployment ids to a runtime env var that is absent in the
        // serverless functions — dynamic pages then emit every chunk twice, once with
        // `?dpl=undefined` (~1.9MB duplicate downloads per cold visit). Forcing it off bakes
        // the id at build time; skew protection (x-nextjs-deployment-id) is unaffected.
        runtimeServerDeploymentId: false,
        inlineCss: false,
        cssChunking: false,
        esmExternals: true,
        scrollRestoration: true,
        serverSourceMaps: false,
        webpackBuildWorker: true,
        webpackMemoryOptimizations: true,
        swcPlugins: [['@lingui/swc-plugin', {}]],
        serverActions: {
            bodySizeLimit: '80mb',
        },
    },
    images: imagesConfig,
    redirects: redirectsConfig,
    rewrites: rewritesConfig,
    headers: headersConfig,
    webpack: webpackConfig,
    turbopack: {
        rules: {
            '*.svg': {
                loaders: [
                    {
                        loader: '@svgr/webpack',
                        options: svgrOptions,
                    },
                ],
                as: '*.js',
            },
        },
    },
};

export default config;
