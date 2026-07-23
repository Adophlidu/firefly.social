export const DEFAULT_PERPS_MARKET = 'BTC-USDC';

export interface PerpsMarketSelectionItem {
    coin: string;
    favorite: boolean;
    favoritedAt?: number;
    categories?: string[];
}

export type PerpsMarketCategory = string;

export function filterAndOrderPerpsMarkets<T extends PerpsMarketSelectionItem>(
    markets: T[],
    query: string,
    category: PerpsMarketCategory = 'all',
): T[] {
    const normalizedQuery = query.trim().toLowerCase();
    const scoped =
        category === 'favorites'
            ? markets.filter(({ favorite }) => favorite)
            : category === 'all'
              ? markets
              : markets.filter(({ categories }) => categories?.includes(category));
    const filtered = normalizedQuery
        ? scoped.filter(({ coin }) => coin.toLowerCase().includes(normalizedQuery))
        : scoped;
    const favorites = filtered
        .filter(({ favorite }) => favorite)
        .toSorted((first, second) => (first.favoritedAt ?? 0) - (second.favoritedAt ?? 0));
    return [...favorites, ...filtered.filter(({ favorite }) => !favorite)];
}

export function toRawPerpsMarketName(coin: string) {
    return coin.endsWith('-USDC') ? coin.slice(0, -5) : coin;
}

export function toDisplayPerpsMarketName(coin: string) {
    return coin.endsWith('-USDC') ? coin : `${coin}-USDC`;
}

export function resolvePerpsMarketIconUrl(coin: string) {
    return `https://app.hyperliquid.xyz/coins/${encodeURIComponent(toRawPerpsMarketName(coin))}.svg`;
}

export function parsePerpsMarketFromUrl(url: URL): string {
    return url.searchParams.get('coin') || DEFAULT_PERPS_MARKET;
}

export function toPerpsMarketUrl(locale: string, coin: string): string {
    const params = new URLSearchParams({ coin });
    return `/${locale}/perpetuals?${params.toString()}`;
}
