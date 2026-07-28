export function toRawPerpsCoin(coin: string) {
    return coin.endsWith('-USDC') ? coin.slice(0, -5) : coin;
}

export function toPerpsCoinDisplayName(coin: string) {
    return toRawPerpsCoin(coin).split(':').pop() ?? coin;
}

export function toPerpsMarketDisplayName(coin: string) {
    return `${toPerpsCoinDisplayName(coin)}-USDC`;
}
