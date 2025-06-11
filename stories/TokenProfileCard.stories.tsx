import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TokenProfileCard, TokenProfileCardSkeleton } from '@/components/Token/TokenProfileCard.js';

const meta = {
    title: 'Token/TokenProfileCard',
    component: TokenProfileCard,
    render: (args) => {
        return (
            <div className="flex flex-col gap-4">
                <TokenProfileCardSkeleton {...args} />
                <TokenProfileCard {...args} />
            </div>
        );
    },
} satisfies Meta<typeof TokenProfileCard>;

type Story = StoryObj<typeof meta>;
export const Card: Story = {
    args: {
        symbol: 'MASK',
        className: 'w-[415px] bg-primaryBottom p-2 text-main shadow-[0_8px_20px_0_rgba(0,0,0,0.04)]',
    },
};

export default meta;
