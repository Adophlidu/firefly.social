import { type Meta, type StoryObj } from '@storybook/nextjs-vite';

import { TwitterFollowButton } from '@/components/Actions/TwitterFollowButton.js';

const meta = {
    title: 'common/TwitterFollowButton',
    component: TwitterFollowButton,
} satisfies Meta<typeof TwitterFollowButton>;

export const Base: StoryObj<typeof TwitterFollowButton> = {
    args: {
        isPending: true,
    },
};

export const Icon: StoryObj<typeof TwitterFollowButton> = {
    args: {
        variant: 'icon',
    },
};

export default meta;
