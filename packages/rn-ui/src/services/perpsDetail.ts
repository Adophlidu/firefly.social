/* cspell:disable */

import type { FetchPerpsDetailPage } from '@/types/services';
import type { PerpsDetailPageData, PerpsOrderBookLevel } from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const buildOrderBookLevels = (): PerpsOrderBookLevel[] => {
    const depthSeed = [0.22, 0.12, 0.3, 0.88, 0.52, 0.74, 0.48, 0.3, 0.66, 0.26, 0.58, 0.34];

    return depthSeed.map((depth, index) => {
        return {
            id: `ob-${index + 1}`,
            buyAmountLabel: '10,000.00',
            buyPriceLabel: '94.4c',
            buyDepthRatio: depth,
            sellPriceLabel: '96.4c',
            sellAmountLabel: '10,000.00',
            sellDepthRatio: depthSeed[(index + 3) % depthSeed.length],
        };
    });
};

const detailPageDataByMarket: Record<string, PerpsDetailPageData> = {
    BTCUSDC: {
        ticker: {
            symbol: 'BTCUSDC',
            leverage: '40x',
            marketType: 'Perp',
            lastPriceLabel: '$3,500.14',
            usdPriceLabel: '$68576.10',
            priceChangeLabel: '+6.5%',
            markPriceLabel: '$68576.10',
            stats: [
                { label: '24h Volume', value: '$1.2B' },
                { label: 'Open Interest', value: '$126M' },
                { label: 'Funding', value: '0.0017019%' },
            ],
        },
        orderBook: {
            buyLabel: 'Buy(USDC)',
            sellLabel: 'Sell(USDC)',
            unitLabel: '0.1',
            levels: buildOrderBookLevels(),
        },
        actions: [
            { label: 'Buy/Long', tone: 'buy' },
            { label: 'Sell/Short', tone: 'sell' },
        ],
    },
};

export const loadPerpsDetailPage: FetchPerpsDetailPage = async ({ market }) => {
    await delay(700);

    const data = detailPageDataByMarket[market] ?? detailPageDataByMarket.BTCUSDC;

    return {
        data,
    };
};
