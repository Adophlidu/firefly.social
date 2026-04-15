/* cspell:disable */

'use client';

import {
    arbitrum,
    aurora,
    avalanche,
    base,
    baseSepolia,
    blast,
    bsc,
    celo,
    confluxESpace,
    fantom,
    gnosis,
    hyperEvm,
    lens,
    lensTestnet,
    linea,
    mainnet,
    metis,
    monadTestnet,
    optimism,
    plasma,
    polygon,
    scroll,
    xLayer,
    zkSync,
    zora,
} from 'viem/chains';

/**
 * List of all supported chains
 */
export const chains = [
    mainnet,
    base,
    baseSepolia,
    bsc,
    polygon,
    optimism,
    arbitrum,
    gnosis,
    avalanche,
    blast,
    aurora,
    confluxESpace,
    fantom,
    xLayer,
    metis,
    zora,
    scroll,
    linea,
    zkSync,
    celo,
    lens,
    lensTestnet,
    monadTestnet,
    plasma,
    hyperEvm,
] as const;

export const visibleChains = [
    mainnet,
    base,
    bsc,
    polygon,
    optimism,
    arbitrum,
    gnosis,
    avalanche,
    blast,
    aurora,
    confluxESpace,
    fantom,
    xLayer,
    metis,
    zora,
    scroll,
    linea,
    zkSync,
    celo,
    lens,
    plasma,
    hyperEvm,
] as const satisfies ReadonlyArray<(typeof chains)[number]>;

// privy wallet currently only supports these 10 chains
export const privyVisibleChains = [
    mainnet,
    base,
    bsc,
    optimism,
    polygon,
    linea,
    arbitrum,
    zkSync,
    celo,
    plasma,
] as const satisfies ReadonlyArray<(typeof chains)[number]>;

export const rpSupportedChains = [mainnet, bsc, base, optimism, polygon, arbitrum];
