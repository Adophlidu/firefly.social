import type { Meta, StoryObj } from '@storybook/react';

import { RecipientItem } from '@/components/FireflyWallet/SendTransactionModal/RecipientItem.js';

const meta = {
    title: 'FireflyWallet/RecipientItem',
    component: RecipientItem,
} satisfies Meta<typeof RecipientItem>;

export default meta;

export const Default: StoryObj<typeof RecipientItem> = {
    args: {
        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    },
    render(args) {
        return (
            <div style={{ width: '240px' }}>
                <RecipientItem {...args} />
            </div>
        );
    },
};
