/* cspell:disable */
/* eslint-disable no-relative-import-paths/no-relative-import-paths */

import { execSync } from 'child_process';
import { createRequire } from 'module';
import type { NextConfig } from 'next';

import { headersConfig } from './.next-config/headers.config';
import { imagesConfig } from './.next-config/images.config';
import { redirectsConfig } from './.next-config/redirects.config';
import { rewritesConfig } from './.next-config/rewrites.config';
import { svgrOptions, webpackConfig } from './.next-config/webpack.config';

const require = createRequire(import.meta.url);

const config: NextConfig = {
    allowedDevOrigins: ['firefly.social'],
    productionBrowserSourceMaps: false,

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
        sri: { algorithm: 'sha256' },
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
