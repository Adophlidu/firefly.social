import type { Meta, StoryObj } from '@storybook/react';

import { TokenProfile, TokenProfileSkeleton } from '@/components/Token/TokenProfile.js';

const meta = {
    title: 'Token/TokenProfile',
    component: TokenProfile,
    render: (args) => {
        return (
            <div className="flex flex-col gap-4">
                <TokenProfileSkeleton {...args} />
                <TokenProfile {...args} />
            </div>
        );
    },
} satisfies Meta<typeof TokenProfile>;

type Story = StoryObj<typeof meta>;
export const Symbol: Story = {
    args: {
        symbol: 'MASK',
        className: 'w-[415px] bg-primaryBottom p-2 text-main shadow-[0_8px_20px_0_rgba(0,0,0,0.04)]',
    },
};

export default meta;
