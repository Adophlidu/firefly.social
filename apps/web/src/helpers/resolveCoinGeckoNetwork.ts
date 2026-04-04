import { createLookupTableResolver } from '@dimensiondev/utils';

import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export const resolveCoinGeckoNetwork = createLookupTableResolver<number, string | undefined>(
    {
        [EthereumChainId.Mainnet]: 'eth',
        [EthereumChainId.BSC]: 'bsc',
        [EthereumChainId.Polygon]: 'polygon_pos',
        [EthereumChainId.Arbitrum]: 'arbitrum',
        [EthereumChainId.Optimism]: 'optimism',
        [SolanaChainId.Mainnet]: 'solana',
        [EthereumChainId.Base]: 'base',
    },
    undefined,
);
