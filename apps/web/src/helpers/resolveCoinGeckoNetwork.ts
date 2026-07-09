import { createLookupTableResolver } from '@dimensiondev/utils';
import { robinhood, solana } from '@dimensiondev/web3/chains';
import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'viem/chains';

export const resolveCoinGeckoNetwork = createLookupTableResolver<number, string | undefined>(
    {
        [mainnet.id]: 'eth',
        [bsc.id]: 'bsc',
        [polygon.id]: 'polygon_pos',
        [arbitrum.id]: 'arbitrum',
        [optimism.id]: 'optimism',
        [solana.id]: 'solana',
        [base.id]: 'base',
        [robinhood.id]: 'robinhood',
    },
    undefined,
);
