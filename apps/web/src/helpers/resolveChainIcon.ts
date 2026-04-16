import { createLookupTableResolver } from '@dimensiondev/utils';
import {
    arbitrum,
    aurora,
    avalanche,
    base,
    bsc,
    confluxESpace,
    fantom,
    gnosis,
    mainnet,
    mantle,
    metis,
    optimism,
    polygon,
    scroll,
    xLayer,
    zora,
} from 'viem/chains';

import { SolanaChainId } from '@/web3-shared/solana/types.js';

export const resolveChainIcon = createLookupTableResolver<number, string | undefined>(
    {
        [mainnet.id]: '/image/chains/ethereum.png',
        [base.id]: '/image/chains/base.png',
        [bsc.id]: '/image/chains/binance.png',
        [polygon.id]: '/image/chains/polygon.png',
        [optimism.id]: '/image/chains/optimism.png',
        [arbitrum.id]: '/image/chains/arbitrum.png',
        [gnosis.id]: '/image/chains/xdai.png',
        [avalanche.id]: '/image/chains/avalanche.png',
        [aurora.id]: '/image/chains/aurora.png',
        [confluxESpace.id]: '/image/chains/conflux.png',
        [fantom.id]: '/image/chains/fantom.png',
        [scroll.id]: '/image/chains/scroll.png',
        [metis.id]: '/image/chains/metis.png',
        [mantle.id]: '/image/chains/mantle.png',
        [xLayer.id]: '/image/chains/xlayer.svg',
        [zora.id]: '/image/chains/zora.png',
        [SolanaChainId.Mainnet]: '/image/chains/solana.png',
    },
    undefined,
);
