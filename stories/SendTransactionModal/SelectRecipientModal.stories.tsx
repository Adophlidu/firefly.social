import type { Meta, StoryObj } from '@storybook/react';

import { SelectRecipientModal } from '@/components/SendTransactionModal/SelectRecipientModal.js';
import { SelectRecipientModalWithQuery } from '@/components/SendTransactionModal/SelectRecipientModalWithQuery.js';
import { NetworkType, Source } from '@/constants/enum.js';

const meta = {
    title: 'FireflyWallet/SelectRecipientModal',
    component: SelectRecipientModal,
} satisfies Meta<typeof SelectRecipientModal>;

export default meta;

export const Default: StoryObj<typeof SelectRecipientModal> = {
    args: {
        isLoading: false,
    },
    argTypes: {
        isLoading: {
            control: {
                type: 'boolean',
            },
        },
    },
    render(args) {
        return (
            <SelectRecipientModal
                open
                {...args}
                onQuery={async (keyword) => {
                    console.log(keyword);
                }}
                recipients={[
                    {
                        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                    },
                    {
                        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                        avatar: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/b663cd63-fecf-4d0f-7f87-0e0b6fd42800/original',
                        handle: 'vitalik.eth',
                        ens: 'vitalik.eth',
                        username: 'Vitalik Buterin',
                        source: Source.Lens,
                    },
                    {
                        avatar: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/b663cd63-fecf-4d0f-7f87-0e0b6fd42800/original',
                        address: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                        ens: 'vitalik.eth',
                    },
                ]}
            />
        );
    },
};

export const NoData: StoryObj<typeof SelectRecipientModal> = {
    render(args) {
        return <SelectRecipientModal open {...args} recipients={[]} />;
    },
};

export const Loading: StoryObj<typeof SelectRecipientModal> = {
    render(args) {
        return <SelectRecipientModal open {...args} isLoading />;
    },
};

export const WithQuery: StoryObj<typeof SelectRecipientModalWithQuery> = {
    argTypes: {
        networkType: {
            control: {
                type: 'select',
            },
            options: [undefined, NetworkType.Ethereum, NetworkType.Solana],
        },
    },
    args: {
        networkType: NetworkType.Solana,
    },
    render(args) {
        return (
            <SelectRecipientModalWithQuery
                {...args}
                open
                onSelect={(item) => {
                    console.log(item);
                }}
            />
        );
    },
};
