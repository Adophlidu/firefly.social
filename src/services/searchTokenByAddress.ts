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
];

export const searchTokenByAddress = memoizePromise(
    async function searchTokenByAddress(address: string) {
        const singal = new AbortController();
        return Promise.any(
            networks.map(async (network) => {
                const result = await CoinGecko.getTokenByAddress(address, network, singal.signal);
                if (result?.attributes.coingecko_coin_id) {
                    singal.abort();
                    return result;
                }

                throw new Error(`Invalid token on ${network}`);
            }),
        );
    },
    (address) => address,
);
