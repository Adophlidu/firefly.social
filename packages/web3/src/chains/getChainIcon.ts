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

import { solana, solanaDevnet, solanaTestnet } from '@/chains/sol.js';

const DEFAULT_EVM_ICON = '/image/chains/ethereum.png';

export const CHAIN_ICON_MAP: Readonly<Record<number, string>> = {
    [mainnet.id]: '/image/chains/ethereum.png',
    [bsc.id]: '/image/chains/binance.png',
    [base.id]: '/image/chains/base.png',
    [polygon.id]: '/image/chains/polygon.png',
    [arbitrum.id]: '/image/chains/arbitrum.png',
    [gnosis.id]: '/image/chains/xdai.png',
    [scroll.id]: 'https://static.debank.com/image/chain/logo_url/scrl/1fa5c7e0bfd353ed0a97c1476c9c42d2.png',
    [avalanche.id]: '/image/chains/avalanche.png',
    [aurora.id]: '/image/chains/aurora.png',
    [confluxESpace.id]: '/image/chains/conflux.png',
    [fantom.id]: '/image/chains/fantom.png',
    [xLayer.id]: '/image/chains/xlayer.png',
    [metis.id]: 'https://static.debank.com/image/chain/logo_url/metis/7485c0a61c1e05fdf707113b6b6ac917.png',
    [zora.id]: 'https://static.debank.com/image/chain/logo_url/zora/de39f62c4489a2359d5e1198a8e02ef1.png',
    [celo.id]: '/image/chains/celo.png',
    [zkSync.id]: '/image/chains/zksync.png',
    [linea.id]: '/image/chains/linea.png',
    [plasma.id]: '/image/chains/plasma.png',
    [blast.id]: '/image/chains/blast.png',
    [optimism.id]: '/image/chains/optimism.png',
    [lens.id]: 'https://explorer.lens.xyz/images/gho.png',
    [mantle.id]: 'https://static.debank.com/image/chain/logo_url/mantle/2feecb18b9e8e63f29fdb39ca2c46ed0.png',
    [solana.id]: '/image/chains/solana.png',
    [solanaDevnet.id]: '/image/chains/solana.png',
    [solanaTestnet.id]: '/image/chains/solana.png',
};

export function getChainIcon(chainId: number | undefined) {
    if (typeof chainId !== 'number') return undefined;
    return CHAIN_ICON_MAP[chainId] ?? DEFAULT_EVM_ICON;
}
