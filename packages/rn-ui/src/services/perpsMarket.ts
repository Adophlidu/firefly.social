import { type FetchPerpsMarketPage, type PerpsMarketPageResponse } from '@/types/services';
import { type PerpsMarketItem, type PerpsMarketSort, type PerpsMarketTab } from '@/types/ui';

const delay = async (ms: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

const tabs = [
    { label: 'Favorites', value: 'favorites' },
    { label: 'Perps', value: 'perps' },
    { label: 'Crypto', value: 'crypto' },
    { label: 'Stocks', value: 'stocks' },
    { label: 'Commodities', value: 'commodities' },
] as const;

const sortOptions = [
    { label: 'Volume', value: 'volume' },
    { label: 'Price Change', value: 'priceChange' },
    { label: 'Open Interest', value: 'openInterest' },
] as const;

const tabSymbols: Record<Exclude<PerpsMarketTab, 'favorites'>, string[]> = {
    perps: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE'],
    crypto: ['ADA', 'AVAX', 'DOT', 'ATOM', 'LTC', 'LINK'],
    stocks: ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'META'],
    commodities: ['XAU', 'XAG', 'WTI', 'NG', 'COPPER', 'WHEAT'],
};

const categoryLeverage: Record<Exclude<PerpsMarketTab, 'favorites'>, string[]> = {
    perps: ['40x', '30x', '25x', '20x'],
    crypto: ['20x', '15x', '12x', '10x'],
    stocks: ['10x', '8x', '6x', '5x'],
    commodities: ['15x', '12x', '10x', '8x'],
};

const formatCompactMoney = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
    return `$${(value / 1_000).toFixed(0)}K`;
};

const formatPrice = (value: number) => {
    if (value >= 1000) {
        return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    }

    if (value >= 1) {
        return `$${value.toFixed(2)}`;
    }

    return `$${value.toFixed(4)}`;
};

const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const buildMarketRows = () => {
    const rows: PerpsMarketItem[] = [];
    const categories = Object.keys(tabSymbols) as Array<Exclude<PerpsMarketTab, 'favorites'>>;

    categories.forEach((category, categoryIndex) => {
        const symbols = tabSymbols[category];

        for (let round = 0; round < 6; round += 1) {
            symbols.forEach((symbol, symbolIndex) => {
                const serial = categoryIndex * 100 + round * 10 + symbolIndex;
                const volumeValue = 400_000_000 + serial * 17_500_000;
                const priceBase = 0.8 + serial * 1.91;
                const priceChangeValue = ((serial % 17) - 8) * 0.41;
                const openInterestValue = 120_000_000 + serial * 8_250_000;

                rows.push({
                    id: `${category}-${symbol.toLowerCase()}-${round}`,
                    symbol,
                    leverage: categoryLeverage[category][serial % categoryLeverage[category].length],
                    volumeLabel: `${formatCompactMoney(volumeValue)} Vol`,
                    volumeValue,
                    priceLabel: formatPrice(priceBase),
                    priceChangeLabel: formatPercent(priceChangeValue),
                    priceChangeValue,
                    openInterestLabel: `${formatCompactMoney(openInterestValue)} OI`,
                    openInterestValue,
                    category,
                    favorite: round % 2 === 0 && symbolIndex < 3,
                });
            });
        }
    });

    return rows;
};

const marketRows: PerpsMarketItem[] = buildMarketRows();

const sortItems = (items: PerpsMarketItem[], sortBy: PerpsMarketSort) => {
    const sorted = [...items];

    if (sortBy === 'priceChange') {
        return sorted.sort((left, right) => right.priceChangeValue - left.priceChangeValue);
    }

    if (sortBy === 'openInterest') {
        return sorted.sort((left, right) => right.openInterestValue - left.openInterestValue);
    }

    return sorted.sort((left, right) => right.volumeValue - left.volumeValue);
};

export const loadPerpsMarketPage: FetchPerpsMarketPage = async ({
    tab,
    sortBy,
    page,
    pageSize,
}): Promise<PerpsMarketPageResponse> => {
    await delay(600);

    const filteredItems = marketRows.filter((item) => {
        if (tab === 'favorites') {
            return Boolean(item.favorite);
        }

        return item.category === tab;
    });

    const sortedItems = sortItems(filteredItems, sortBy);
    const start = (page - 1) * pageSize;
    const end = page * pageSize;

    return {
        tabs: [...tabs],
        sortOptions: [...sortOptions],
        items: sortedItems.slice(start, end),
        hasMore: end < sortedItems.length,
    };
};
