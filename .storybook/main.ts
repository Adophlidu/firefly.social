import type { StorybookConfig } from '@storybook/experimental-nextjs-vite';

const config: StorybookConfig = {
    stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
    addons: ['@storybook/addon-essentials', '@storybook/addon-onboarding', '@storybook/addon-styling-webpack'],
    framework: {
        name: '@storybook/experimental-nextjs-vite',
        options: {},
    },
    staticDirs: ['../public'],
    features: {
        experimentalRSC: true,
    },
};
export default config;
