const DexScreenerChainMap = {
    1: 'ethereum',
    56: 'bsc',
    137: 'polygon',
    10: 'optimism',
    43114: 'avalanche',
    250: 'fantom',
    42161: 'arbitrum',
    43113: 'avalanche',
    8453: 'base',
    101: 'solana',
} as const;

export function resolveDexScreenerUrl(chainId: number, address: string) {
    const chain = DexScreenerChainMap[chainId as keyof typeof DexScreenerChainMap];
    if (!chain) return null;
    return `https://dexscreener.com/${chain}/${address}`;
}
