/* cspell:disable */

import { type FetchPerpsTradeDetailPage } from '@/types/services';
import {
    type PerpsOpenOrderItem,
    type PerpsPositionItem,
    type PerpsTradeDetailPageData,
    type PerpsTradeOrderBookEntry,
} from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const buildAsks = (): PerpsTradeOrderBookEntry[] => {
    const widths = [88, 22, 12, 44, 8, 8, 8];
    const basePrice = 70405;
    return widths.map((w, i) => ({
        price: (basePrice - i).toLocaleString('en-US'),
        amount: '1,234.91',
        depthRatio: w / 112,
    }));
};

const buildBids = (): PerpsTradeOrderBookEntry[] => {
    const widths = [88, 22, 12, 44, 8, 8, 8];
    const basePrice = 70400;
    return widths.map((w, i) => ({
        price: (basePrice - i).toLocaleString('en-US'),
        amount: '1,234.91',
        depthRatio: w / 112,
    }));
};

const buildPositions = (): PerpsPositionItem[] => [
    {
        id: 'pos-1',
        symbol: 'BTC',
        direction: 'buy',
        marginMode: 'isolated',
        leverage: '3x',
        pnl: '+$99.99',
        pnlPercent: '+25.17%',
        pnlValue: 99.99,
        sizeCoin: '0.00029',
        sizeUnit: 'BTC',
        margin: '$3.54',
        funding: '+0.00',
        fundingValue: 0,
        entryPrice: '68,523',
        markPrice: '68,223',
        liqPrice: '46,325',
        tpPrice: '71,923',
        slPrice: '65,140',
    },
    {
        id: 'pos-2',
        symbol: 'BTC',
        direction: 'sell',
        marginMode: 'isolated',
        leverage: '3x',
        pnl: '+$99.99',
        pnlPercent: '+25.17%',
        pnlValue: 99.99,
        sizeCoin: '0.00029',
        sizeUnit: 'BTC',
        margin: '3.54',
        funding: '+0.00',
        fundingValue: 0,
        entryPrice: '68,523',
        markPrice: '68,223',
        liqPrice: '46,325',
        tpPrice: '--',
        slPrice: '--',
    },
];

const buildOpenOrders = (): PerpsOpenOrderItem[] => [
    {
        id: 'order-1',
        symbol: 'BTC',
        orderTypeLabel: 'Limit',
        side: 'sell',
        leverageLabel: '3x',
        size: '0.00018',
        filled: '0',
        orderPrice: '60,000',
        tpSl: '71,923 / 65,140',
        createdAt: '02/25/2026, 16:42:59',
    },
    {
        id: 'order-2',
        symbol: 'BTC',
        orderTypeLabel: 'Limit',
        side: 'buy',
        leverageLabel: '3x',
        size: '0.00018',
        filled: '0',
        orderPrice: '60,000',
        tpSl: '71,923 / 65,140',
        createdAt: '02/25/2026, 16:42:59',
    },
    {
        id: 'order-3',
        symbol: 'BTC',
        orderTypeLabel: 'Trigger',
        side: 'sell',
        triggerCondition: 'Price below 58,000',
        unfilledSize: '0.00019 / 0.00019',
        priceLabel: 'Market',
        size: '0.00018',
        filled: '0',
        orderPrice: '60,000',
        createdAt: '02/25/2026, 16:42:59',
    },
];

const tradeDetailDataByMarket: Record<string, PerpsTradeDetailPageData> = {
    BTCUSDC: {
        ticker: {
            symbol: 'BTCUSDC',
            leverage: '40x',
            marketType: 'Perp',
            priceChangeLabel: '+1.00%',
            priceChangeValue: 1.0,
            fundingRate: '0.0002%',
            countdown: '00:31:02',
        },
        orderBook: {
            asks: buildAsks(),
            bids: buildBids(),
            lastPrice: '$70,401',
            lastPriceUsd: '70,400',
            markPrice: '70,400',
        },
        tradeForm: {
            marginMode: 'cross',
            leverage: '3x',
            orderType: 'market',
            amount: '25%',
            available: '$234.56',
            reduceOnly: true,
            tpSlEnabled: false,
            sliderValue: 0.25,
            buy: {
                estLiqPrice: '$45,454',
                cost: '$10.11',
            },
            sell: {
                estLiqPrice: '$45,454',
                cost: '$10.11',
            },
        },
        positions: buildPositions(),
        openOrders: buildOpenOrders(),
        openOrdersCount: 3,
    },
};

export const loadPerpsTradeDetailPage: FetchPerpsTradeDetailPage = async ({ market }) => {
    await delay(700);

    const data = tradeDetailDataByMarket[market] ?? tradeDetailDataByMarket.BTCUSDC;

    return { data };
};
