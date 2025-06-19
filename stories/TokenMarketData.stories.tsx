import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { TokenMarketData, type TokenMarketDataProps } from '@/components/TokenProfile/TokenMarketData.js';
import { useTokenInfo } from '@/hooks/useTokenInfo.js';

interface Props extends Pick<TokenMarketDataProps, 'tradeRecords' | 'range' | 'traderCount'> {
    symbol: string;
}
function WrapTokenMarketData({ symbol, ...rest }: Props) {
    const { data: token, isLoading } = useTokenInfo({ token_symbol: symbol });
    const [chainId, setChainId] = useState<number | undefined>();
    const [address, setAddress] = useState<string>();
    if (isLoading) return <div>Loading...</div>;

    if (!token) return <div>token not found: {symbol}</div>;

    return (
        <TokenMarketData
            token={token}
            {...rest}
            chainId={chainId}
            address={address}
            onContractChange={(chainId, address) => {
                setChainId(chainId);
                setAddress(address);
            }}
        />
    );
}

const meta = {
    title: 'Token/TokenMarketData',
    component: WrapTokenMarketData,
} satisfies Meta<typeof WrapTokenMarketData>;

type Story = StoryObj<typeof meta>;

export const Base: Story = {
    args: {
        symbol: 'mask',
        range: '7d',
        traderCount: 10,
        tradeRecords: [
            {
                type: 'buy',
                date: 1746850296131,
                value: 1.1147951013430362,
                amount: '10000000000000000000',
                uiAmount: '10',
                decimals: 18,
                user: {
                    name: 'vitalik.eth',
                    avatar: 'https://i.pravatar.cc/100?u=vitalik.eth',
                },
            },
            {
                type: 'sell',
                date: 1746921928998,
                value: 1.4402451541063872,
                amount: '10000000000000000000',
                uiAmount: '10',
                decimals: 18,
                user: {
                    name: 'vitalik.eth',
                    avatar: 'https://i.pravatar.cc/100?u=vitalik.eth',
                },
            },
            {
                type: 'buy',
                date: 1746921928998, // exactly the same as the previous record
                value: 1.4402451541063872,
                amount: '20000000000000000000',
                uiAmount: '20',
                decimals: 18,
                user: {
                    name: 'vitalik.eth',
                    avatar: 'https://i.pravatar.cc/200?u=sujiyan.eth',
                },
            },
        ],
    },
};

export default meta;
