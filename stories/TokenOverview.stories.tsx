import type { Meta, StoryObj } from '@storybook/react';

import {
    Overview,
    type TokenOverviewProps,
} from '@/app/(normal)/token/[symbol]/[[...slug]]/categories/TokenOverview.js';

interface Props extends TokenOverviewProps {
    coinId: string;
}
function WrapTokenOverview({ coinId, chainId, address }: Props) {
    return (
        <div style={{ width: 567 }}>
            <Overview coinId={coinId} chainId={chainId} address={address} />
        </div>
    );
}

const meta = {
    title: 'Token/TokenOverview',
    component: WrapTokenOverview,
} satisfies Meta<typeof WrapTokenOverview>;

type Story = StoryObj<typeof meta>;

export const Base: Story = {
    args: {
        coinId: '',
        chainId: 56,
        address: '0x5caef24098a04d65780ae7a54ad2bfa0548a4d28',
    },
    parameters: {
        layout: 'centered',
    },
};

export default meta;
