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

import CoinGecko from '@/web3-constants/evm/coingecko.json' with { type: 'json' };

const COINGECKO_NETWORK_BY_CHAIN_ID: Record<number, string> = {
    [mainnet.id]: 'Mainnet',
    [base.id]: 'Base',
    [bsc.id]: 'BSC',
    [polygon.id]: 'Polygon',
    [optimism.id]: 'Optimism',
    [arbitrum.id]: 'Arbitrum',
    [gnosis.id]: 'xDai',
    [avalanche.id]: 'Avalanche',
    [aurora.id]: 'Aurora',
    [confluxESpace.id]: 'Conflux',
    [fantom.id]: 'Fantom',
    [xLayer.id]: 'XLayer',
    [metis.id]: 'Metis',
    [mantle.id]: 'Mantle',
    [zora.id]: 'Zora',
    [scroll.id]: 'Scroll',
    [celo.id]: 'Celo',
    [lens.id]: 'Lens',
    [zkSync.id]: 'ZksyncEra',
    [linea.id]: 'Linea',
    [plasma.id]: 'Plasma',
    [blast.id]: 'Blast',
};

export function getCoinGeckoConstants(chainId: number) {
    const chainName = COINGECKO_NETWORK_BY_CHAIN_ID[chainId];
    if (!chainName) return {} as { PLATFORM_ID?: string; COIN_ID?: string };

    return {
        PLATFORM_ID: CoinGecko.PLATFORM_ID[chainName as keyof typeof CoinGecko.PLATFORM_ID] || '',
        COIN_ID: CoinGecko.COIN_ID[chainName as keyof typeof CoinGecko.COIN_ID] || '',
    };
}
