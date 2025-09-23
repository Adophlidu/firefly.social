import type { Meta, StoryObj } from '@storybook/react';

import { Switch } from '@/components/Switch/index.js';

const meta = {
    title: 'common/Switch',
    component: Switch,
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        size: {
            control: { type: 'radio' },
            options: ['small', 'medium'],
        },
    },
} satisfies Meta<typeof Switch>;

export const Base: StoryObj<typeof meta> = {
    args: {
        size: 'medium',
    },
};

export default meta;
