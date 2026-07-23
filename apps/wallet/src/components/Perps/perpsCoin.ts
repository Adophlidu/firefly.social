/** Strips the `-USDC` quote suffix from a perps market symbol (e.g. `BTC-USDC` → `BTC`). */
export function toRawPerpsCoin(coin: string) {
    return coin.endsWith('-USDC') ? coin.slice(0, -5) : coin;
}
