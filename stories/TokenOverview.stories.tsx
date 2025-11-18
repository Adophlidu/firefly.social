import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Overview, type TokenOverviewProps } from '@/components/TokenProfile/Overview.js';

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
        chainId: 8453,
        address: '0x2efac0a597a37050aafcf4bec627249d533dd9f8',
    },
    parameters: {
        layout: 'centered',
    },
};

export default meta;
