/* cspell:disable */

import { memoizePromise } from '@/helpers/memoizePromise.js';
import { CoinGecko } from '@/providers/coingecko/index.js';

const networks = [
    'eth',
    'solana',
    'polygon-pos',
    'arbitrum',
    'arbitrum-nova',
    'avax',
    'base',
    'bsc',
    'linea',
    'manta-pacific',
    'opbnb',
    'optimism',
    'polygon-zkevm',
    'scroll',
    'sei',
    'zksync',
] as const;

const networkChainIdMap: Record<(typeof networks)[number], number> = {
    eth: 1,
    solana: 101,
    'polygon-pos': 137,
    arbitrum: 42161,
    'arbitrum-nova': 42170,
    avax: 43114,
    base: 8453,
    bsc: 56,
    linea: 59144,
    'manta-pacific': 169,
    opbnb: 204,
    optimism: 10,
    'polygon-zkevm': 1101,
    scroll: 534351,
    sei: 1329,
    zksync: 324,
};

export const searchTokenByAddress = memoizePromise(
    async function searchTokenByAddress(address: string) {
        const signal = new AbortController();
        return Promise.any(
            networks.map(async (network) => {
                const result = await CoinGecko.getTokenByAddress(address, network, signal.signal);
                if (result?.attributes.coingecko_coin_id || result?.attributes.symbol) {
                    signal.abort();
                    result.attributes.chain_id = networkChainIdMap[network];
                    return result;
                }

                throw new Error(`Invalid token on ${network}`);
            }),
        );
    },
    (address) => address,
);
