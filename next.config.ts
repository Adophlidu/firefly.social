/* cspell:disable */

import createBundleAnalyzer from '@next/bundle-analyzer';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import type { NextConfig } from 'next';
import { resolve } from 'path';
import StatoscopeWebpackPlugin from '@statoscope/webpack-plugin';

const require = createRequire(import.meta.url);

const cspConfig = {
    'default-src': ["'self'", 'https:', 'wss:', 'data:', 'blob:'],
    'script-src': [
        "'self'",
        'www.googletagmanager.com',
        'static.cloudflareinsights.com',
        'cdn.jsdelivr.net',
        '*.vercel-scripts.com',
        '*.firefly.land',
        'vercel.live',
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

const svgrOptions = {
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
};
const config: NextConfig = {
    productionBrowserSourceMaps: false,

    // Server-only external packages for Turbopack (native modules)
    serverExternalPackages: ['@napi-rs/image', 'canvas'],

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
        WEB3_CONSTANTS_RPC: process.env.WEB3_CONSTANTS_RPC ?? '',
        MASK_SENTRY_DSN: process.env.MASK_SENTRY_DSN ?? '',
        MASK_SENTRY: 'disabled',
        MASK_MIXPANEL: 'disabled',
        COMMIT_HASH: execSync('git rev-parse --short HEAD').toString().trim(),
    },
    experimental: {
        inlineCss: true,
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
            {
                hostname: '*.firefly.social',
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
                hostname: '*.firefly.land',
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
            {
                protocol: 'https',
                hostname: '*.amazonaws.com',
            },
        ],
    },
    async redirects() {
        return [
            {
                source: '/profile/far/:path*',
                destination: '/profile/farcaster/:path*',
                permanent: true,
            },
            {
                source: '/profile/twitter/:path*',
                destination: '/profile/x/:path*',
                permanent: true,
            },
        ];
    },
    async headers() {
        return [
            {
                source: '/(.*)?', // Matches all pages
                headers: [
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
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

        // Suppress bigint-buffer warning about failed to load bindings
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            {
                module: /bigint-buffer/,
            },
            /bigint.*Failed to load bindings/,
        ];

        config.plugins.push(
            ...[
                new context.webpack.IgnorePlugin({
                    resourceRegExp: /^(lokijs|pino-pretty|encoding)$/,
                }),
            ],
        );

        // Add Statoscope plugin if enabled (only for client builds)
        if (process.env.ANALYZE_STATOSCOPE === 'true') {
            const outputPath = resolve(__dirname);
            config.plugins.push(
                new StatoscopeWebpackPlugin({
                    saveReportTo: resolve(outputPath, 'statoscope.html'),
                    saveStatsTo: resolve(outputPath, 'statoscope.json'),
                    saveOnlyStats: true,
                    watchMode: false,
                    compressor: 'gzip',
                    extensions: [],
                }),
            );
        }

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

        config.resolve.fallback = {
            ...config.resolve.fallback,
            buffer: require.resolve('buffer'),
            perf_hooks: false,
        };

        const parseHTMLServer = resolve(__dirname, 'src/helpers/parseHtml.js');
        const parseHTMLClient = resolve(__dirname, 'src/helpers/parseHtmlNative.js');
        if (!context.isServer) {
            config.resolve.alias[parseHTMLServer] = parseHTMLClient;
        } else {
            config.resolve.alias[parseHTMLClient] = parseHTMLServer;
        }

        config.module.rules.push(
            {
                test: /\.svg$/i,
                type: 'asset',
                resourceQuery: /url/, // *.svg?url
                parser: {
                    dataUrlCondition: {
                        maxSize: 50 * 1024,
                    },
                },
            },
            {
                test: /\.svg$/i,
                exclude: /src\/mask_pkgs/,
                loader: '@svgr/webpack',
                resourceQuery: { not: [/url/] }, // exclude react component if *.svg?url
                options: svgrOptions,
            },
            {
                test: /\.svg$/i,
                include: /src\/mask_pkgs/,
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

        config.optimization.splitChunks = {
            chunks: 'all',
            maxInitialRequests: 5,
        };

        return config;
    },
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
