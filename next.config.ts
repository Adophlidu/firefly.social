/* cspell:disable */

import { execSync } from 'child_process';
import CopyPlugin from 'copy-webpack-plugin';
import { createRequire } from 'module';
import type { NextConfig } from 'next';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(dirname(import.meta.url));
const outputPath = fileURLToPath(new URL('./public', import.meta.url));

const cspConfig = {
    'default-src': ["'self'", 'https:', 'wss:', 'data:', 'blob:'],
    'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'www.googletagmanager.com/',
        'cdn.jsdelivr.net',
        '*.vercel-scripts.com',
        '*.firefly.land/',
        'vercel.live',
        'tag.safary.club',
    ],
    'img-src': ["'self'", 'https:', 'data:', 'blob:'],
    'style-src': ["'self'", "'unsafe-inline'", 'vercel.live', 'fonts.googleapis.com'],
    'worker-src': ["'self'", 'blob:'],
    'report-uri': [] as string[],
};

// Add Sentry DSN to CSP report-uri
if (process.env.NEXT_PUBLIC_SENTRY_REPORT_URL) {
    cspConfig['report-uri'] = [process.env.NEXT_PUBLIC_SENTRY_REPORT_URL];
}

if (process.env.NODE_ENV === 'development') {
    Object.entries(cspConfig).forEach(([key, value]) => {
        if (key === 'report-uri') return;
        value.push('http://localhost:3000', 'ws://localhost:3000');
    });
}

export const POLICY_SETTINGS = Object.entries(cspConfig)
    .map(([key, value]) => `${key} ${value.join(' ')}`)
    .join('; ');

const config: NextConfig = {
    transpilePackages: [
        '@masknet/base',
        '@masknet/encryption',
        '@masknet/typed-message',
        '@masknet/typed-message-react',
    ],
    productionBrowserSourceMaps: false,

    // Note: we run tsc and eslint in other places
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
    env: {
        WEB3_CONSTANTS_RPC: process.env.WEB3_CONSTANTS_RPC ?? '',
        MASK_SENTRY_DSN: process.env.MASK_SENTRY_DSN ?? '',
        MASK_SENTRY: 'disabled',
        MASK_MIXPANEL: 'disabled',
        COMMIT_HASH: execSync('git rev-parse --short HEAD').toString().trim(),
    },
    experimental: {
        esmExternals: true,
        scrollRestoration: true,
        serverSourceMaps: false,
        webpackBuildWorker: true,
        swcPlugins: [['@lingui/swc-plugin', {}]],
        serverActions: {
            bodySizeLimit: '80mb',
        },
    },
    images: {
        dangerouslyAllowSVG: false,
        unoptimized: process.env.NODE_ENV === 'development',
        remotePatterns: [
            {
                hostname: 'images.unsplash.com',
            },
            {
                hostname: 'tailwindui.com',
            },
            {
                hostname: 'pbs.twimg.com',
            },
            {
                hostname: 'static-assets.hey.xyz',
            },
            {
                hostname: 'gw.ipfs-lens.dev',
            },
            {
                hostname: 'cdn.stamp.fyi',
            },
            {
                hostname: 'i.imgur.com',
            },
            {
                hostname: 'ik.imagekit.io',
            },
            {
                hostname: '*.mask.social',
            },
            { protocol: 'https', hostname: 'pbs.twimg.com' },
            { protocol: 'https', hostname: 'abs.twimg.com' },
            {
                hostname: '*.giphy.com',
            },
            {
                hostname: 'static.debank.com',
            },
            {
                protocol: 'https',
                hostname: 'ipfs.io',
            },
            {
                protocol: 'https',
                hostname: 'media.firefly.land',
            },
            {
                hostname: 'imagedelivery.net',
            },
            {
                protocol: 'https',
                hostname: 'coin-images.coingecko.com',
            },
            {
                hostname: 'raw.githubusercontent.com',
            },
            {
                hostname: 'assets.coingecko.com',
            },
            {
                hostname: 'cdn.simplehash.com',
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)?', // Matches all pages
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff', // Prevent MIME type sniffing
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block', // Prevent rendering
                    },
                    {
                        key: 'Content-Security-Policy-Report-Only',
                        value: POLICY_SETTINGS,
                    },
                ],
            },
            {
                source: '/next-debug.log',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate',
                    },
                ],
            },
        ];
    },
    webpack(config, context) {
        if (!config.plugins) config.plugins = [];
        if (!config.module.rules) config.module.rules = [];
        config.output.environment = { asyncFunction: true };

        config.plugins.push(
            ...[
                new context.webpack.IgnorePlugin({
                    resourceRegExp: /^(lokijs|pino-pretty|encoding)$/,
                }),
                new context.webpack.DefinePlugin({
                    'process.version': JSON.stringify(process.env.npm_package_version),
                }),
            ],
        );

        config.optimization = {
            ...config.optimization,
            usedExports: false,
        };

        config.experiments = {
            ...config.experiments,
            backCompat: false,
            asyncWebAssembly: true,
        };

        config.externals = [...(config.externals ?? []), '@napi-rs/image', 'canvas'];

        config.resolve.extensionAlias = {
            ...config.resolve.extensionAlias,
            '.js': ['.js', '.ts', '.tsx'],
            '.mjs': ['.mts', '.mjs'],
        };
        config.resolve.conditionNames = ['mask-src', '...'];
        config.resolve.fallback = {
            ...config.resolve.fallback,
            http: require.resolve('stream-http'),
            https: require.resolve('https-browserify'),
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
            buffer: require.resolve('buffer'),
            zlib: require.resolve('zlib-browserify'),
            'text-encoding': require.resolve('@sinonjs/text-encoding'),
            perf_hooks: false,
        };

        config.module.rules.push(
            {
                test: /\.svg$/i,
                type: 'asset',
                resourceQuery: /url/, // *.svg?url
            },
            {
                test: /\.svg$/i,
                exclude: /src\/maskbook/,
                loader: '@svgr/webpack',
                resourceQuery: { not: [/url/] }, // exclude react component if *.svg?url
                options: {
                    ref: true,
                    svgoConfig: {
                        plugins: [
                            {
                                name: 'preset-default',
                                params: {
                                    overrides: {
                                        // disable plugins
                                        removeViewBox: false,
                                    },
                                },
                            },
                            'prefixIds',
                        ],
                    },
                },
            },
            {
                test: /\.svg$/i,
                include: /src\/maskbook/,
                loader: require.resolve('svgo-loader'),
                options: {
                    js2svg: {
                        pretty: false,
                    },
                },
                dependency(data: string) {
                    if (data === '') return false;
                    return true;
                },
                type: 'asset/resource',
            },
        );

        return config;
    },
};

export default config;
