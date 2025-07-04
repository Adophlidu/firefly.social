import type { Meta, StoryObj } from '@storybook/react';

import { TransactionHistory } from '@/components/TransactionHistory/list.js';
import { isValidAddressEthereum } from '@/helpers/isValidAddress.js';

const meta = {
    title: 'FireflyWallet/TransactionHistory',
    component: TransactionHistory,
} satisfies Meta<typeof TransactionHistory>;

export default meta;

export const Default: StoryObj<typeof TransactionHistory> = {
    args: {
        address: '0x790116d0685eB197B886DAcAD9C247f785987A4a',
    },
    render(args) {
        return (
            <TransactionHistory
                {...args}
                chains={isValidAddressEthereum(args.address) ? [1, 8453, 56, 10, 137, 59144, 42161, 324, 42220] : [101]}
            />
        );
    },
};
