/* cspell:disable */
import { createRequire } from 'module';
import type { NextConfig } from 'next';
import { resolve } from 'path';

const require = createRequire(import.meta.url);

const projectRoot = resolve(import.meta.dirname, '..');

export const svgrOptions = {
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

export const webpackConfig: NonNullable<NextConfig['webpack']> = (config, context) => {
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

    const parseHTMLServer = resolve(projectRoot, 'src/libs/parseHtml.js');
    const parseHTMLClient = resolve(projectRoot, 'src/libs/parseHtmlNative.js');
    if (!context.isServer) {
        config.resolve.alias[parseHTMLServer] = parseHTMLClient;
    } else {
        config.resolve.alias[parseHTMLClient] = parseHTMLServer;
    }

    const loggerServer = resolve(projectRoot, 'src/libs/Logger.js');
    const loggerClient = resolve(projectRoot, 'src/libs/LoggerNative.js');
    if (!context.isServer) {
        config.resolve.alias[loggerServer] = loggerClient;
    } else {
        config.resolve.alias[loggerClient] = loggerServer;
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
        maxInitialRequests: 10,
    };

    return config;
};
