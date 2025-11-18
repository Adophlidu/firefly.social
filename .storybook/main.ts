import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { StorybookConfig } from '@storybook/nextjs-vite';
import svgr from 'vite-plugin-svgr';

const config: StorybookConfig = {
    stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: [getAbsolutePath('@storybook/addon-docs')],
    framework: {
        name: getAbsolutePath('@storybook/nextjs-vite'),
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

function getAbsolutePath(value: string): any {
    return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
