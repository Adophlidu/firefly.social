/* cspell:disable */

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
    mantle,
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

import { robinhood } from '@/chains/robinhood.js';

/**
 * Full list of supported chains (Firefly web / wagmi).
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
    mantle,
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
    robinhood,
] as const;
/**
 * Chains shown in wallet UI (Firefly wallet).
 */
export const visibleChains = [
    mainnet,
    base,
    bsc,
    optimism,
    polygon,
    avalanche,
    blast,
    scroll,
    linea,
    arbitrum,
    zkSync,
    celo,
    plasma,
    robinhood,
] as const satisfies ReadonlyArray<(typeof chains)[number]>;

/**
 * Chains Privy embedded wallet supports in the web app (subset of {@link chains}).
 */
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
    robinhood,
] as const satisfies ReadonlyArray<(typeof chains)[number]>;

export const rpSupportedChains = [mainnet, bsc, base, optimism, polygon, arbitrum];

export const ETHEREUM_CHAIN_IDS = chains.map((x) => x.id);

export type ChainId = (typeof chains)[number]['id'];
