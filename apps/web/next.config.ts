/* cspell:disable */
/* eslint-disable no-relative-import-paths/no-relative-import-paths */

import createBundleAnalyzer from '@next/bundle-analyzer';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { type NextConfig } from 'next';

import { headersConfig } from './.next-config/headers.config';
import { imagesConfig } from './.next-config/images.config';
import { redirectsConfig } from './.next-config/redirects.config';
import { rewritesConfig } from './.next-config/rewrites.config';
import { svgrOptions, webpackConfig } from './.next-config/webpack.config';

const require = createRequire(import.meta.url);

const config: NextConfig = {
    productionBrowserSourceMaps: false,

    // Server-only external packages for Turbopack (native modules)
    serverExternalPackages: ['@napi-rs/image', 'canvas', 'pino', 'pino-pretty', 'thread-stream'],

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
    },
    images: imagesConfig,
    redirects: redirectsConfig,
    rewrites: rewritesConfig,
    headers: headersConfig,
    webpack: webpackConfig,
    turbopack: {
        resolveAlias: {
            // hack for https://github.com/vercel/next.js/issues/78696
            'twitter-api-v2': './prebuilt/twitter-api-v2.js',
        },
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

const withBundleAnalyzer = createBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
    analyzerMode: 'static',
});

export default withBundleAnalyzer(config);
