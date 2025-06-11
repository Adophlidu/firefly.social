import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TwitterBlockButton } from '@/components/Actions/TwitterBlockButton.js';

const meta = {
    title: 'common/TwitterBlockButton',
    component: TwitterBlockButton,
} satisfies Meta<typeof TwitterBlockButton>;

export const Base: StoryObj<typeof TwitterBlockButton> = {
    args: {
        isBlocked: true,
    },
};

export const Icon: StoryObj<typeof TwitterBlockButton> = {
    args: {
        variant: 'icon',
    },
};

export default meta;
