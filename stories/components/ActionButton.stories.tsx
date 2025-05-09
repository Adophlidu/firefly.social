import type { Meta, StoryObj } from '@storybook/react';

import { ActionButton } from '@/components/ActionButton.js';

const meta = {
    title: 'ActionButton',
    component: ActionButton,
} satisfies Meta<typeof ActionButton>;

type Story = StoryObj<typeof meta>;
export const Primary: Story = {
    args: {
        variant: 'primary',
        children: 'Primary',
    },
};
export const Secondary: Story = {
    args: {
        variant: 'secondary',
        children: 'Secondary',
    },
};

export const Danger: Story = {
    args: {
        variant: 'danger',
        children: 'Danger',
    },
};

export default meta;
