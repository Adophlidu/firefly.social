import type { StorybookConfig } from '@storybook/experimental-nextjs-vite';
import svgr from 'vite-plugin-svgr';

const config: StorybookConfig = {
    stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-essentials'],
    framework: {
        name: '@storybook/experimental-nextjs-vite',
        options: {},
    },
    staticDirs: ['../public'],
    features: {
        experimentalRSC: true,
    },
    async viteFinal(config) {
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
