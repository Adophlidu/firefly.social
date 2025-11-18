import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TokenCard } from '@/components/EmbedCards/TokenCard.js';

const meta = {
    title: 'Token/EmbedCards/TokenCard',
    component: TokenCard,
    render: (args) => {
        return (
            <div className="flex flex-col gap-4">
                <TokenCard {...args} />
            </div>
        );
    },
} satisfies Meta<typeof TokenCard>;

type Story = StoryObj<typeof meta>;
export const Card: Story = {
    args: {
        address: 'BefmaTp3ur3Jed492AyPy9gPKdJm3Fvvjt36qyyyXGZk',
        className: 'w-[415px]',
    },
};

export default meta;
