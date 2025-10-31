import { createLookupTableResolver } from '@firefly/utils';

// https://docs.coingecko.com/reference/networks-list
export const resolveCoinGeckoChain = createLookupTableResolver<number, string | undefined>(
    {
        42161: 'arbitrum-nova',
        56: 'binance-smart-chain',
        1666600000: 'harmony-shard-0',
        10: 'optimistic-ethereum',
        137: 'polygon-pos',
        592: 'astar',
        1313161554: 'aurora',
        43114: 'avalanche',
        8453: 'base',
        288: 'boba',
        1030: 'conflux',
        25: 'cronos',
        1: 'ethereum',
        250: 'fantom',
        122: 'fuse',
        2222: 'kava',
        1284: 'moonbeam',
        534352: 'scroll',
        101: 'solana',
        100: 'xdai',
        324: 'zksync',
    },
    undefined,
);
