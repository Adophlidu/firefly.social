import { createLookupTableResolver } from '@dimensiondev/utils';

import { EthereumChainId } from '@/web3-shared/evm/types.js';
import { SolanaChainId } from '@/web3-shared/solana/types.js';

export const resolveChainIcon = createLookupTableResolver<number, string | undefined>(
    {
        [EthereumChainId.Mainnet]: '/image/chains/ethereum.png',
        [EthereumChainId.Base]: '/image/chains/base.png',
        [EthereumChainId.BSC]: '/image/chains/binance.png',
        [EthereumChainId.Polygon]: '/image/chains/polygon.png',
        [EthereumChainId.Optimism]: '/image/chains/optimism.png',
        [EthereumChainId.Arbitrum]: '/image/chains/arbitrum.png',
        [EthereumChainId.xDai]: '/image/chains/xdai.png',
        [EthereumChainId.Avalanche]: '/image/chains/avalanche.png',
        [EthereumChainId.Aurora]: '/image/chains/aurora.png',
        [EthereumChainId.Conflux]: '/image/chains/conflux.png',
        [EthereumChainId.Fantom]: '/image/chains/fantom.png',
        [EthereumChainId.Scroll]: '/image/chains/scroll.png',
        [EthereumChainId.Metis]: '/image/chains/metis.png',
        [EthereumChainId.Mantle]: '/image/chains/mantle.png',
        [EthereumChainId.XLayer]: '/image/chains/xlayer.svg',
        [EthereumChainId.Zora]: '/image/chains/zora.png',
        [SolanaChainId.Mainnet]: '/image/chains/solana.png',
    },
    undefined,
);
