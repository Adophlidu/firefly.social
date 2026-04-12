import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PriceChart } from '@/components/PriceChart/index.js';
import type { PriceRecord, TradeRecord } from '@/types/token.js';

const meta = {
    title: 'Token/PriceChart',
    component: PriceChart,
} satisfies Meta<typeof PriceChart>;

type Story = StoryObj<typeof meta>;

const prices: PriceRecord[] = [
    [1746515165170, 1.1169423072281808],
    [1746515468157, 1.1189951305129229],
    [1746515771326, 1.119395722425674],
    [1746516059473, 1.1184286979316194],
    [1746516367608, 1.1182733688215893],
    [1746516666355, 1.1171341108142292],
    [1746516964012, 1.1152978844508326],
    [1746517247968, 1.1155890153848746],
    [1746517567601, 1.1147951013430362],
    [1746517927687, 1.1143635676299828],
    [1746518169982, 1.1141011519882063],
    [1746518465253, 1.1137184873906278],
    [1746518767478, 1.109335091251218],
    [1746519067849, 1.1069544025394704],
    [1746519369799, 1.1016251102829075],
    [1746519712726, 1.0989220185301953],
    [1746519966747, 1.0961786276543262],
    [1746520266920, 1.0962726164914254],
    [1746520563731, 1.0989933967313907],
].map((x) => ({ date: x[0], value: x[1] }));

const tradeRecords: TradeRecord[] = [
    {
        // left edge
        chainId: 1,
        hash: '1',
        type: 'sell',
        date: 1746515165170,
        value: 1.1169423072281808,
        amount: '10000000000000000000',
        uiAmount: '10',
        decimals: 18,
        user: {
            name: 'vitalik.eth',
            avatar: 'https://i.pravatar.cc/100?u=vitalik.eth',
        },
    },
    {
        chainId: 1,
        hash: '2',
        type: 'buy',
        date: 1746517567601,
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
        chainId: 1,
        hash: '3',
        type: 'sell',
        date: 1746519712726,
        value: 1.0989220185301953,
        amount: '20000000000000000000',
        uiAmount: '20',
        decimals: 18,
        user: {
            name: 'vitalik.eth',
            avatar: 'https://i.pravatar.cc/100?u=vitalik.eth',
        },
    },
    {
        chainId: 1,
        hash: '4',
        type: 'sell',
        date: 1746519966747,
        value: 1.1147951013430362,
        amount: '10000000000000000000',
        uiAmount: '10',
        decimals: 18,
        user: {
            name: 'vitalik.eth',
            avatar: 'https://i.pravatar.cc/100?u=suji.eth',
        },
    },
    {
        chainId: 1,
        hash: '5',
        type: 'buy',
        date: 1746520266920,
        value: 1.1147951013430362,
        amount: '10000000000000000000',
        uiAmount: '10',
        decimals: 18,
        user: {
            name: 'vitalik.eth',
            avatar: 'https://i.pravatar.cc/100?u=suji.eth',
        },
    },
    {
        // right edge
        chainId: 1,
        hash: '6',
        type: 'buy',
        date: 1746520563731,
        value: 1.0989933967313907,
        amount: '10000000000000000000',
        uiAmount: '10',
        decimals: 18,
        user: {
            name: 'vitalik.eth',
            avatar: 'https://i.pravatar.cc/100?u=suji.eth',
        },
    },
];

export const Base: Story = {
    args: {
        style: {
            width: '100%',
            height: '300px',
        },
        records: prices,
        tradeRecords,
        activeTradeHash: '2',
    },
};

export default meta;
