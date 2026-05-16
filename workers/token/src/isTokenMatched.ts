export function isTokenMatched<T extends { name: string; symbol: string }>(token: T, keyword: string) {
    return [token.name, token.symbol].some((x) => x.toLowerCase() === keyword.replace(/^\$/, '').toLowerCase());
}
