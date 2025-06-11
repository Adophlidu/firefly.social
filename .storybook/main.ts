import type { StorybookConfig } from '@storybook/nextjs-vite';
import { fileURLToPath } from 'node:url';
import svgr from 'vite-plugin-svgr';

const config: StorybookConfig = {
    stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-docs'],
    framework: {
        name: '@storybook/nextjs-vite',
        options: {},
    },
    staticDirs: ['../public'],
    features: {
        experimentalRSC: true,
    },
    async viteFinal(config) {
        config.resolve.alias = {
            '@': fileURLToPath(new URL('../src', import.meta.url)),
        };
        config.plugins.forEach((plugin) => {
            if (Array.isArray(plugin)) {
                plugin.forEach((p) => {
                    if (p.name === 'vite-plugin-storybook-nextjs-image') {
                        p.enforce = undefined;
                    }
                });
            }
        });
        const { mergeConfig } = await import('vite');

        return mergeConfig(config, {
            plugins: [
                {
                    ...svgr({
                        include: '**/*.svg',
                        svgrOptions: {
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
                    }),
                    enforce: 'pre',
                },
            ],
        });
    },
};
export default config;
