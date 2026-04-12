import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { SymbolTag } from '@/components/Markup/MarkupLink/SymbolTag.js';

const meta = {
    title: 'common/SymbolTag',
    component: SymbolTag,
} satisfies Meta<typeof SymbolTag>;

type Story = StoryObj<typeof meta>;

export const Symbol: Story = {
    args: {
        title: '$ETH',
    },
};

export default meta;
