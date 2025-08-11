import type { Meta, StoryObj } from '@storybook/react';

import { ReceiveChainItem } from '@/components/FireflyWallet/ReceiveModal/ReceiveChainItem.js';

const meta = {
    title: 'FireflyWallet/ReceiveChainItem',
    component: ReceiveChainItem,
} satisfies Meta<typeof ReceiveChainItem>;

export default meta;

export const Default: StoryObj<typeof ReceiveChainItem> = {
    args: {
        name: 'Ethereum',
        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        avatar: 'https://static.debank.com/image/chain/logo_url/eth/42ba589cd077e7bdd97db6480b0ff61d.png',
    },
    render(args) {
        return (
            <div style={{ width: '370px' }}>
                <ReceiveChainItem {...args} />
            </div>
        );
    },
};
