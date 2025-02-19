import urlcat from 'urlcat';

export function resolveTokenPageUrl(symbol: string, chainId?: string, isSymbol?: boolean) {
    return urlcat('/token/:symbol', {
        symbol,
        chainId,
        isSymbol,
    });
}
