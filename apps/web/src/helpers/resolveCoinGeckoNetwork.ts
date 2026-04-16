import { createLookupTableResolver } from '@dimensiondev/utils';
import { arbitrum, base, bsc, mainnet, optimism, polygon } from 'viem/chains';

import { SolanaChainId } from '@/web3-shared/solana/types.js';

export const resolveCoinGeckoNetwork = createLookupTableResolver<number, string | undefined>(
    {
        [mainnet.id]: 'eth',
        [bsc.id]: 'bsc',
        [polygon.id]: 'polygon_pos',
        [arbitrum.id]: 'arbitrum',
        [optimism.id]: 'optimism',
        [SolanaChainId.Mainnet]: 'solana',
        [base.id]: 'base',
    },
    undefined,
);
