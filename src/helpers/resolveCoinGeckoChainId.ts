import { createLookupTableResolver } from '@firefly/utils';

// https://docs.coingecko.com/reference/networks-list
export const resolveCoinGeckoChainId = createLookupTableResolver<string, number | undefined>(
    {
        'arbitrum-nova': 42161,
        'binance-smart-chain': 56,
        'harmony-shard-0': 1666600000,
        'optimistic-ethereum': 10,
        'polygon-pos': 137,
        astar: 592,
        aurora: 1313161554,
        avalanche: 43114,
        base: 8453,
        boba: 288,
        conflux: 1030,
        cronos: 25,
        ethereum: 1,
        fantom: 250,
        fuse: 122,
        kava: 2222,
        moonbeam: 1284,
        scroll: 534352,
        solana: 101,
        xdai: 100,
        zksync: 324,
    },
    undefined,
);
