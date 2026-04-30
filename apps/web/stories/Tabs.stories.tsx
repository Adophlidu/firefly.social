import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Tab, Tabs, type TabsProps } from '@/components/Tabs/index.js';

const meta = {
    title: 'common/Tabs',
    component: Tabs,
} satisfies Meta<typeof Tabs>;

function Render(args: Omit<TabsProps, 'onChange' | 'value'>) {
    const [value, setValue] = useState('react');
    return (
        <Tabs {...args} onChange={setValue} value={value}>
            <Tab value="react">React</Tab>
            <Tab value="vue">Vue</Tab>
            <Tab value="angular">Angular</Tab>
        </Tabs>
    );
}

export const Base: StoryObj<typeof Tabs> = {
    args: {
        variant: 'default',
        value: 'react',
    },
    render: (args) => <Render {...args} />,
};

export default meta;
