import { type Meta, type StoryObj } from '@storybook/nextjs-vite';

import { ProfileNFTs } from '@/components/Profile/NFTs.js';

const meta = {
    title: 'Profile/NFTs',
    component: ProfileNFTs,
    render: (args) => {
        return (
            <div style={{ width: 591 }}>
                <ProfileNFTs {...args} />
            </div>
        );
    },
} satisfies Meta<typeof ProfileNFTs>;

type Story = StoryObj<typeof meta>;

export const NFTList: Story = {
    args: {
        address: '0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5',
        addresses: ['0x7cbba07e31dc7b12bb69a1209c5b11a8ac50acf5', 'B9HNZSGtXME8wkrJmf4VYX1p7LuuFgVai6TFQ2pZ74c6'],
    },
    parameters: {
        layout: 'center',
    },
};

export default meta;
