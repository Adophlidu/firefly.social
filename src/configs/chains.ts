/* cspell:disable */

'use client';

import { chains as LensChains } from '@lens-chain/sdk/viem';
import {
    arbitrum as wagmiArbitrum,
    aurora as wagmiAurora,
    avalanche as wagmiAvalanche,
    base as wagmiBase,
    baseSepolia as wagmiBaseSepolia,
    bsc as wagmiBsc,
    celo as wagmiCelo,
    confluxESpace as wagmiConfluxESpace,
    fantom as wagmiFantom,
    gnosis as wagmiGnosis,
    linea as wagmiLinea,
    mainnet as wagmiMainnet,
    metis as wagmiMetis,
    optimism as wagmiOptimism,
    polygon as wagmiPolygon,
    scroll as wagmiScroll,
    xLayer as wagmiXLayer,
    zkSync as wagmiZkSync,
    zora as wagmiZora,
} from 'wagmi/chains';

export const chains = [
    wagmiMainnet,
    wagmiBase,
    wagmiBaseSepolia,
    wagmiBsc,
    wagmiPolygon,
    wagmiOptimism,
    wagmiArbitrum,
    wagmiGnosis,
    wagmiAvalanche,
    wagmiAurora,
    wagmiConfluxESpace,
    wagmiFantom,
    wagmiXLayer,
    wagmiMetis,
    wagmiZora,
    wagmiScroll,
    wagmiLinea,
    wagmiZkSync,
    wagmiCelo,
    LensChains.mainnet,
    LensChains.testnet,
] as const;

export const visibleChains = [
    wagmiMainnet,
    wagmiBase,
    wagmiBsc,
    wagmiPolygon,
    wagmiOptimism,
    wagmiArbitrum,
    wagmiGnosis,
    wagmiAvalanche,
    wagmiAurora,
    wagmiConfluxESpace,
    wagmiFantom,
    wagmiXLayer,
    wagmiMetis,
    wagmiZora,
    wagmiScroll,
    wagmiLinea,
    wagmiZkSync,
    wagmiCelo,
    LensChains.mainnet,
] as const satisfies ReadonlyArray<(typeof chains)[number]>;

// privy wallet currently only supports these 10 chains
export const privyVisibleChains = [
    wagmiMainnet,
    wagmiBase,
    wagmiBsc,
    wagmiOptimism,
    wagmiPolygon,
    wagmiLinea,
    wagmiArbitrum,
    wagmiZkSync,
    wagmiCelo,
] as const satisfies ReadonlyArray<(typeof chains)[number]>;
