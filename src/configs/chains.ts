/* cspell:disable */

'use client';

import { defineChain } from 'viem/utils';
import { chainConfig } from 'viem/zksync';
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
    monadTestnet as wagmiMonadTestnet,
    optimism as wagmiOptimism,
    polygon as wagmiPolygon,
    scroll as wagmiScroll,
    xLayer as wagmiXLayer,
    zkSync as wagmiZkSync,
    zora as wagmiZora,
} from 'wagmi/chains';

export const lensMainnet = defineChain({
    ...chainConfig,
    id: 232,
    name: 'Lens',
    network: 'lens-chain-mainnet',
    nativeCurrency: {
        name: 'GHO Token',
        symbol: 'GHO',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.lens.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Lens Explorer',
            url: 'https://explorer.lens.xyz/',
        },
    },
    contracts: {
        multicall3: {
            address: '0x6b6dEa4D80e3077D076733A04c48F63c3BA49320',
        },
        wrappedGasToken: {
            address: '0x6bdc36e20d267ff0dd6097799f82e78907105e2f',
        },
    },
    testnet: false,
});

export const lensTestnet = defineChain({
    ...chainConfig,
    id: 37111,
    name: 'Lens Testnet',
    network: 'lens-chain-testnet',
    nativeCurrency: {
        name: 'Grass Token',
        symbol: 'GRASS',
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.testnet.lens.xyz'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Lens Testnet Explorer',
            url: 'https://explorer.testnet.lens.xyz/',
        },
    },
    contracts: {
        multicall3: {
            address: '0x8A44EDE8a6843a997bC0Cc4659e4dB1Da8f91116',
        },
        wrappedGasToken: {
            address: '0xeee5a340Cdc9c179Db25dea45AcfD5FE8d4d3eB8',
        },
    },
    testnet: true,
});

/**
 * List of all supported chains
 */
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
    lensMainnet,
    lensTestnet,
    wagmiMonadTestnet,
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
    lensMainnet,
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
