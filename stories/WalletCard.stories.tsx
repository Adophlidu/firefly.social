import { type Meta, type StoryObj } from '@storybook/nextjs-vite';

import { WalletCard } from '@/components/EmbedCards/WalletCard.js';

const meta = {
    title: 'Token/EmbedCards/WalletCard',
    component: WalletCard,
} satisfies Meta<typeof WalletCard>;

type Story = StoryObj<typeof meta>;

export const Token: Story = {
    args: {
        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        style: {
            width: 500,
        },
    },
};

export default meta;
