import {
    arbitrum,
    aurora,
    avalanche,
    base,
    blast,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    lens,
    linea,
    mainnet,
    mantle,
    metis,
    optimism,
    plasma,
    polygon,
    scroll,
    xLayer,
    zkSync,
    zora,
} from 'viem/chains';

import { robinhood } from '@/chains/robinhood.js';
import { solana, solanaDevnet, solanaTestnet } from '@/chains/sol.js';

export const CHAIN_ICON_MAP: Readonly<Record<number, string>> = {
    [mainnet.id]: '/image/chains/ethereum.png',
    [bsc.id]: '/image/chains/binance.png',
    [base.id]: '/image/chains/base.png',
    [polygon.id]: '/image/chains/polygon.png',
    [arbitrum.id]: '/image/chains/arbitrum.png',
    [gnosis.id]: '/image/chains/xdai.png',
    [scroll.id]: '/image/chains/scroll.png',
    [avalanche.id]: '/image/chains/avalanche.png',
    [aurora.id]: '/image/chains/aurora.png',
    [confluxESpace.id]: '/image/chains/conflux.png',
    [fantom.id]: '/image/chains/fantom.png',
    [xLayer.id]: '/image/chains/xlayer.png',
    [metis.id]: '/image/chains/metis.png',
    [zora.id]: '/image/chains/zora.png',
    [celo.id]: '/image/chains/celo.png',
    [zkSync.id]: '/image/chains/zksync.png',
    [linea.id]: '/image/chains/linea.png',
    [plasma.id]: '/image/chains/plasma.png',
    [blast.id]: '/image/chains/blast.png',
    [optimism.id]: '/image/chains/optimism.png',
    [lens.id]: '/image/chains/gho.png',
    [mantle.id]: '/image/chains/mantle.jpg',
    [solana.id]: '/image/chains/solana.png',
    [solanaDevnet.id]: '/image/chains/solana.png',
    [solanaTestnet.id]: '/image/chains/solana.png',
    [robinhood.id]: '/image/chains/robinhood.png',
};

export function getChainIcon(chainId: number | undefined) {
    if (typeof chainId !== 'number') return undefined;
    return CHAIN_ICON_MAP[chainId] ?? CHAIN_ICON_MAP[mainnet.id];
}
